import { WAREHOUSE_ID, WAREHOUSE_LABEL } from "./inventory";
import {
  getItem,
  getItems,
  getStockQty,
  recordMovement
} from "./inventory-service";
import { store, nextId } from "./store";
import type { StockTransferRequest, TransferLine, TransferStatus } from "./transfer";
import { isTransferAwaitingSend } from "./transfer";
import { sheetsWriterActive, writeTransferFromWorkflow, resolveKodeBahan } from "./inventory-sheets-writer";
import { loadInventoryBundle } from "./inventory-bundle-loader";
import { saldoLokasi } from "./inventory-metrics";
import { outletDisplayName, toOutletSlug } from "./outlet-identity";
import { recordAuditEvent } from "./audit-log";

function touch(tr: StockTransferRequest) {
  tr.updatedAt = new Date().toISOString();
}

function outletLabel(outletId: string) {
  return outletDisplayName(outletId);
}

function ensureTransfers() {
  getItems();
  const s = store();
  if (!Array.isArray(s.stockTransferRequests)) s.stockTransferRequests = [];
}

export function listTransferRequests(scopeOutletId?: string): StockTransferRequest[] {
  ensureTransfers();
  const all = store().stockTransferRequests ?? [];
  if (!scopeOutletId) return [...all];
  return all.filter((t) => t.toOutletId === scopeOutletId);
}

export function getTransferRequest(id: string) {
  ensureTransfers();
  return (store().stockTransferRequests ?? []).find((t) => t.id === id);
}

function assertLines(lines: TransferLine[]) {
  if (!lines.length) throw new Error("Minimal 1 barang.");
  for (const line of lines) {
    const item = getItem(line.itemId);
    if (!item) throw new Error(`Barang tidak ditemukan: ${line.itemName}`);
    if (line.qty <= 0) throw new Error("Jumlah harus lebih dari 0.");
  }
}

async function warehouseStockOk(lines: TransferLine[]) {
  if (sheetsWriterActive()) {
    const { bahanList, bundle } = await loadInventoryBundle();
    for (const line of lines) {
      const kodeBahan = resolveKodeBahan({ itemId: line.itemId, itemName: line.itemName }, bahanList);
      if (!kodeBahan) {
        throw new Error(`Bahan "${line.itemName}" tidak cocok dengan master bahan Supabase.`);
      }
      const avail = saldoLokasi(
        kodeBahan,
        "GDG",
        bundle.opname,
        bundle.masuk,
        bundle.transfer,
        bundle.pemakaian,
        bundle.waste
      );
      if (avail < line.qty) {
        throw new Error(
          `Stok gudang ${line.itemName} tidak cukup (tersedia ${avail} ${line.unit}, minta ${line.qty}).`
        );
      }
    }
    return;
  }

  for (const line of lines) {
    const avail = getStockQty(line.itemId, WAREHOUSE_ID);
    if (avail < line.qty) {
      throw new Error(
        `Stok gudang ${line.itemName} tidak cukup (tersedia ${avail} ${line.unit}, minta ${line.qty}).`
      );
    }
  }
}

export function createTransferRequest(input: {
  toOutletId: string;
  items: TransferLine[];
  requestedById: string;
  requestedByName: string;
  note?: string;
}): StockTransferRequest {
  ensureTransfers();
  assertLines(input.items);
  const toOutletId = toOutletSlug(input.toOutletId) ?? input.toOutletId;

  const s = store();
  const now = new Date().toISOString();
  const id = nextId("TRF");
  const tr: StockTransferRequest = {
    id,
    requestNumber: id,
    fromLocationId: WAREHOUSE_ID,
    fromLocationLabel: WAREHOUSE_LABEL,
    toOutletId,
    toOutletName: outletLabel(toOutletId),
    status: "approved",
    items: input.items,
    requestedById: input.requestedById,
    requestedByName: input.requestedByName,
    note: input.note,
    createdAt: now,
    updatedAt: now
  };
  s.stockTransferRequests.unshift(tr);
  return tr;
}

function setStatus(tr: StockTransferRequest, status: TransferStatus) {
  tr.status = status;
  touch(tr);
}

export async function sendTransferRequest(id: string, sender: { id: string; name: string }) {
  const tr = getTransferRequest(id);
  if (!tr) return { error: "Transfer tidak ditemukan." };
  if (!isTransferAwaitingSend(tr.status)) return { error: "Transfer sudah dikirim atau selesai." };

  try {
    await warehouseStockOk(tr.items);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Stok gudang tidak cukup." };
  }

  if (sheetsWriterActive()) {
    for (const line of tr.items) {
      await writeTransferFromWorkflow({
        transferId: tr.id,
        itemId: line.itemId,
        itemName: line.itemName,
        qty: line.qty,
        toOutletId: tr.toOutletId,
        senderName: sender.name
      });
    }
  } else {
    for (const line of tr.items) {
      recordMovement({
        itemId: line.itemId,
        itemName: line.itemName,
        locationId: WAREHOUSE_ID,
        locationLabel: WAREHOUSE_LABEL,
        movementType: "Transfer Out",
        qty: line.qty,
        unit: line.unit,
        sourceDocType: "stock_transfer",
        sourceDocId: tr.id,
        note: `Kirim ke ${tr.toOutletName ?? tr.toOutletId}`,
        createdBy: sender.name,
        delta: -line.qty
      });
    }
  }

  tr.sentById = sender.id;
  tr.sentByName = sender.name;
  tr.sentAt = new Date().toISOString();
  setStatus(tr, "sent");
  recordAuditEvent({
    action: "inventory.transfer_send",
    actorId: sender.id,
    actorName: sender.name,
    outletId: tr.toOutletId,
    entityType: "stock_transfer",
    entityId: tr.id,
    meta: { itemCount: tr.items.length, toOutletName: tr.toOutletName ?? tr.toOutletId }
  });
  return { ok: true as const, transfer: tr };
}

export async function receiveTransferRequest(id: string, receiver: { id: string; name: string }) {
  const tr = getTransferRequest(id);
  if (!tr) return { error: "Transfer tidak ditemukan." };
  if (tr.status !== "sent") return { error: "Transfer belum dikirim dari gudang." };

  if (!sheetsWriterActive()) {
    const destLabel = tr.toOutletName ?? outletLabel(tr.toOutletId);
    for (const line of tr.items) {
      recordMovement({
        itemId: line.itemId,
        itemName: line.itemName,
        locationId: tr.toOutletId,
        locationLabel: destLabel,
        movementType: "Transfer In",
        qty: line.qty,
        unit: line.unit,
        sourceDocType: "stock_transfer",
        sourceDocId: tr.id,
        note: `Terima dari gudang · ${tr.requestNumber}`,
        createdBy: receiver.name,
        delta: line.qty
      });
    }
  }
  // Supabase: transfer_stok sudah ditulis saat kirim (model atomik GDG → outlet).

  tr.receivedById = receiver.id;
  tr.receivedByName = receiver.name;
  tr.receivedAt = new Date().toISOString();
  setStatus(tr, "received");
  recordAuditEvent({
    action: "inventory.transfer_receive",
    actorId: receiver.id,
    actorName: receiver.name,
    outletId: tr.toOutletId,
    entityType: "stock_transfer",
    entityId: tr.id,
    meta: { itemCount: tr.items.length }
  });
  return { ok: true as const, transfer: tr };
}

export function cancelTransferRequest(id: string) {
  const tr = getTransferRequest(id);
  if (!tr) return { error: "Transfer tidak ditemukan." };
  if (!isTransferAwaitingSend(tr.status)) {
    return { error: "Hanya request yang belum dikirim gudang yang bisa dibatalkan." };
  }
  setStatus(tr, "cancelled");
  recordAuditEvent({
    action: "inventory.transfer_cancel",
    actorName: "system",
    outletId: tr.toOutletId,
    entityType: "stock_transfer",
    entityId: tr.id
  });
  return { ok: true as const, transfer: tr };
}

export function countPendingTransfers(scopeOutletId?: string) {
  return listTransferRequests(scopeOutletId).filter(
    (t) => isTransferAwaitingSend(t.status) || t.status === "sent"
  ).length;
}
