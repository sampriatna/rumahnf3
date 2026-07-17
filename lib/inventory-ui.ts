import type { StatusTone } from "./design-tokens";
import type { TransferStatus } from "./transfer";
import { TRANSFER_STATUS_LABEL, isTransferAwaitingSend } from "./transfer";

export type InventorySourceKind = "dummy" | "sheets" | "supabase";

export function resolveInventorySourceKind(): InventorySourceKind {
  const inv = process.env.INVENTORY_SOURCE?.toLowerCase();
  if (inv === "sheets" || inv === "supabase" || inv === "dummy") return inv;
  const fin = process.env.FINANCE_SOURCE?.toLowerCase();
  if (fin === "sheets" || fin === "supabase") return fin;
  return "dummy";
}

export function inventorySourceLabel(kind = resolveInventorySourceKind()): string {
  switch (kind) {
    case "supabase":
      return "Supabase (movement engine)";
    case "sheets":
      return "Google Sheets (sinkron mutasi)";
    default:
      return "Data demo (mutasi in-memory)";
  }
}

export function transferStatusTone(status: TransferStatus): StatusTone {
  if (isTransferAwaitingSend(status)) return "progress";
  switch (status) {
    case "sent":
      return "active";
    case "received":
      return "success";
    case "rejected":
    case "cancelled":
      return "danger";
    default:
      return "muted";
  }
}

export function transferStatusLabel(status: TransferStatus): string {
  return TRANSFER_STATUS_LABEL[status];
}

const MOVEMENT_LABELS: Record<string, string> = {
  barang_masuk: "Barang Masuk",
  transfer_masuk: "Transfer Masuk",
  transfer_keluar: "Transfer Keluar",
  pemakaian: "Pemakaian Outlet",
  waste: "Waste / Selisih",
  opname: "Opname / Penyesuaian",
  adjustment: "Penyesuaian"
};

export function movementTypeLabel(type: string): string {
  const key = type.trim().toLowerCase().replace(/\s+/g, "_");
  if (MOVEMENT_LABELS[key]) return MOVEMENT_LABELS[key];
  if (key.includes("masuk")) return "Barang Masuk";
  if (key.includes("transfer")) return "Transfer Stok";
  if (key.includes("waste") || key.includes("selisih")) return "Waste / Selisih";
  if (key.includes("opname")) return "Opname";
  if (key.includes("pemakaian")) return "Pemakaian";
  return type;
}

export function movementTypeTone(type: string): StatusTone {
  const t = type.toLowerCase();
  if (t.includes("masuk")) return "success";
  if (t.includes("transfer")) return "active";
  if (t.includes("waste") || t.includes("keluar")) return "danger";
  if (t.includes("opname")) return "progress";
  return "muted";
}
