import {
  type Item,
  type StockMovement,
  type MovementType,
  WAREHOUSE_ID,
  WAREHOUSE_LABEL,
  stockKey,
  normalizeItemName,
  seedItems,
  seedStock,
  type StockRow
} from "./inventory";
import {
  type PurchaseRequest,
  type PurchaseOrder,
  type Supplier,
  seedSuppliers,
  estimatePrice
} from "./purchasing";
import { store, nextId, addApproval } from "./store";
import { OUTLETS } from "./mock-data";
import { needsOwnerPurchaseApproval } from "./approval";
import { recordAuditEvent } from "./audit-log";

function ensureInventorySeeded() {
  const s = store();
  if (s.items.length === 0) {
    s.items = seedItems();
    s.stock = seedStock();
    s.suppliers = seedSuppliers();
  }
}

export function getItems(): Item[] {
  ensureInventorySeeded();
  return store().items.filter((i) => i.active);
}

export function getItem(id: string) {
  ensureInventorySeeded();
  return store().items.find((i) => i.id === id);
}

export function findItemByName(name: string): Item | undefined {
  ensureInventorySeeded();
  const n = normalizeItemName(name);
  return store().items.find((i) => normalizeItemName(i.itemName) === n);
}

export function getStockQty(itemId: string, locationId: string): number {
  ensureInventorySeeded();
  return store().stock[stockKey(itemId, locationId)] ?? 0;
}

export function setStockQty(itemId: string, locationId: string, qty: number) {
  ensureInventorySeeded();
  store().stock[stockKey(itemId, locationId)] = Math.max(0, qty);
}

export function recordMovement(input: {
  itemId: string;
  itemName: string;
  locationId: string;
  locationLabel: string;
  movementType: MovementType;
  qty: number;
  unit: string;
  sourceDocType?: string;
  sourceDocId?: string;
  note?: string;
  createdBy: string;
  /** Delta stok: positif = tambah, negatif = kurang */
  delta: number;
}) {
  ensureInventorySeeded();
  const current = getStockQty(input.itemId, input.locationId);
  setStockQty(input.itemId, input.locationId, current + input.delta);

  const mov: StockMovement = {
    id: nextId("MOV"),
    itemId: input.itemId,
    itemName: input.itemName,
    locationId: input.locationId,
    locationLabel: input.locationLabel,
    movementType: input.movementType,
    qty: input.qty,
    unit: input.unit,
    sourceDocType: input.sourceDocType,
    sourceDocId: input.sourceDocId,
    note: input.note,
    createdBy: input.createdBy,
    createdAt: new Date().toISOString()
  };
  store().movements.unshift(mov);
  return mov;
}

/** Waste dari form — kurangi stok outlet (atau gudang bila tidak ada outlet). */
export function applyWasteFromForm(input: {
  itemName: string;
  qty: number;
  unit: string;
  outletId?: string;
  outletName?: string;
  sourceDocId: string;
  createdBy: string;
  note?: string;
}) {
  const item = findItemByName(input.itemName);
  if (!item) return null;

  const loc = input.outletId ?? WAREHOUSE_ID;
  const label = input.outletName ?? WAREHOUSE_LABEL;

  return recordMovement({
    itemId: item.id,
    itemName: item.itemName,
    locationId: loc,
    locationLabel: label,
    movementType: "Waste",
    qty: input.qty,
    unit: input.unit || item.unit,
    sourceDocType: "form_waste",
    sourceDocId: input.sourceDocId,
    note: input.note,
    createdBy: input.createdBy,
    delta: -input.qty
  });
}

/** Barang masuk dari form — tambah stok di outlet atau gudang. */
export function applyStockInFromForm(input: {
  itemName: string;
  qty: number;
  unit: string;
  outletId?: string;
  outletName?: string;
  sourceDocId: string;
  sourceDocType?: string;
  createdBy: string;
  note?: string;
}) {
  const item = findItemByName(input.itemName);
  if (!item) return null;

  const loc = input.outletId ?? WAREHOUSE_ID;
  const label = input.outletName ?? WAREHOUSE_LABEL;

  return recordMovement({
    itemId: item.id,
    itemName: item.itemName,
    locationId: loc,
    locationLabel: label,
    movementType: "Stock In",
    qty: input.qty,
    unit: input.unit || item.unit,
    sourceDocType: input.sourceDocType ?? "form_stock_in",
    sourceDocId: input.sourceDocId,
    note: input.note,
    createdBy: input.createdBy,
    delta: input.qty
  });
}

/** Transfer keluar gudang → outlet tujuan (form barang keluar). */
export function applyTransferFromWarehouse(input: {
  itemName: string;
  qty: number;
  unit: string;
  destOutletId: string;
  destOutletName: string;
  sourceDocId: string;
  createdBy: string;
}) {
  const item = findItemByName(input.itemName);
  if (!item) return null;

  recordMovement({
    itemId: item.id,
    itemName: item.itemName,
    locationId: WAREHOUSE_ID,
    locationLabel: WAREHOUSE_LABEL,
    movementType: "Transfer Out",
    qty: input.qty,
    unit: input.unit || item.unit,
    sourceDocType: "form_transfer",
    sourceDocId: input.sourceDocId,
    createdBy: input.createdBy,
    delta: -input.qty
  });

  return recordMovement({
    itemId: item.id,
    itemName: item.itemName,
    locationId: input.destOutletId,
    locationLabel: input.destOutletName,
    movementType: "Transfer In",
    qty: input.qty,
    unit: input.unit || item.unit,
    sourceDocType: "form_transfer",
    sourceDocId: input.sourceDocId,
    createdBy: input.createdBy,
    delta: input.qty
  });
}

/** Opname setelah approval — koreksi stok ke nilai fisik. */
export function applyOpnameCorrection(input: {
  itemName: string;
  stokFisik: number;
  outletId?: string;
  outletName?: string;
  sourceDocId: string;
  createdBy: string;
}) {
  const item = findItemByName(input.itemName);
  if (!item) return null;

  const loc = input.outletId ?? WAREHOUSE_ID;
  const label = input.outletName ?? WAREHOUSE_LABEL;
  const current = getStockQty(item.id, loc);
  const delta = input.stokFisik - current;

  if (delta === 0) return null;

  const movement = recordMovement({
    itemId: item.id,
    itemName: item.itemName,
    locationId: loc,
    locationLabel: label,
    movementType: "Opname Correction",
    qty: Math.abs(delta),
    unit: item.unit,
    sourceDocType: "form_opname",
    sourceDocId: input.sourceDocId,
    note: `Koreksi opname: ${current} → ${input.stokFisik}`,
    createdBy: input.createdBy,
    delta
  });
  recordAuditEvent({
    action: "inventory.opname_correction",
    actorName: input.createdBy,
    outletId: input.outletId,
    entityType: "stock_movement",
    entityId: movement.id,
    reason: `Koreksi opname: ${current} → ${input.stokFisik}`,
    meta: { itemName: item.itemName, delta, stokFisik: input.stokFisik }
  });
  return movement;
}

export function addPurchaseRequest(input: Omit<PurchaseRequest, "id" | "createdAt" | "status">) {
  ensureInventorySeeded();
  const pr: PurchaseRequest = {
    ...input,
    id: nextId("PR"),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  store().purchaseRequests.unshift(pr);
  return pr;
}

/** Cek stok gudang; jika cukup transfer ke outlet, jika tidak buat PO. */
export function fulfillRequestBahan(input: {
  submissionId: string;
  itemName: string;
  qty: number;
  unit: string;
  outletId?: string;
  outletName?: string;
  requestedBy: string;
  urgency: string;
  areaUnit?: string;
}) {
  ensureInventorySeeded();
  const item = findItemByName(input.itemName);
  if (!item) {
    addPurchaseRequest({
      submissionId: input.submissionId,
      itemName: input.itemName,
      qty: input.qty,
      unit: input.unit,
      outletId: input.outletId,
      outletName: input.outletName,
      areaUnit: input.areaUnit,
      urgency: input.urgency,
      requestedBy: input.requestedBy
    });
    createPurchaseOrderFromRequest(input);
    return { action: "purchase" as const };
  }

  const whQty = getStockQty(item.id, WAREHOUSE_ID);
  if (whQty >= input.qty && input.outletId) {
    recordMovement({
      itemId: item.id,
      itemName: item.itemName,
      locationId: WAREHOUSE_ID,
      locationLabel: WAREHOUSE_LABEL,
      movementType: "Transfer Out",
      qty: input.qty,
      unit: input.unit,
      sourceDocType: "request_bahan",
      sourceDocId: input.submissionId,
      createdBy: "Sistem",
      delta: -input.qty
    });
    recordMovement({
      itemId: item.id,
      itemName: item.itemName,
      locationId: input.outletId,
      locationLabel: input.outletName ?? input.outletId,
      movementType: "Transfer In",
      qty: input.qty,
      unit: input.unit,
      sourceDocType: "request_bahan",
      sourceDocId: input.submissionId,
      createdBy: "Sistem",
      delta: input.qty
    });
    return { action: "transfer" as const };
  }

  addPurchaseRequest({
    submissionId: input.submissionId,
    itemName: input.itemName,
    qty: input.qty,
    unit: input.unit,
    outletId: input.outletId,
    outletName: input.outletName,
    areaUnit: input.areaUnit,
    urgency: input.urgency,
    requestedBy: input.requestedBy
  });
  createPurchaseOrderFromRequest(input);
  return { action: "purchase" as const };
}

function createPurchaseOrderFromRequest(input: {
  submissionId: string;
  itemName: string;
  qty: number;
  unit: string;
  outletId?: string;
  outletName?: string;
  requestedBy: string;
  areaUnit?: string;
}) {
  const item = findItemByName(input.itemName);
  const supplier = item?.supplierId
    ? store().suppliers.find((s) => s.id === item.supplierId)
    : store().suppliers[0];

  const po: PurchaseOrder = {
    id: nextId("PO"),
    supplierId: supplier?.id ?? "sup-1",
    supplierName: supplier?.name ?? "Supplier",
    purchaseRequestId: input.submissionId,
    requestedBy: input.requestedBy,
    outletId: input.outletId,
    outletName: input.outletName,
    areaUnit: input.areaUnit,
    items: [{ itemName: input.itemName, qty: input.qty, unit: input.unit }],
    totalEstimated: estimatePrice(input.itemName, input.qty, item?.lastPurchasePrice ?? 15000),
    paymentStatus: "unpaid",
    status: "Draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  registerPurchaseOrder(po);
  return po;
}

function registerPurchaseOrder(po: PurchaseOrder) {
  const now = po.createdAt;
  if (needsOwnerPurchaseApproval(po.totalEstimated)) {
    po.status = "Waiting Approval";
    addApproval({
      id: nextId("APR"),
      requestType: "purchase_order",
      requestLabel: `PO Belanja · ${po.supplierName}`,
      requestId: po.id,
      requestedById: po.requestedBy,
      requestedByName: po.requestedBy,
      outletId: po.outletId,
      outletName: po.outletName,
      amount: po.totalEstimated,
      reason: po.items.map((i) => `${i.itemName} ${i.qty} ${i.unit}`).join(", "),
      status: "pending",
      approverLevel: "owner",
      createdAt: now,
      updatedAt: now
    });
  } else {
    po.status = "Approved";
  }
  store().purchaseOrders.unshift(po);
}

export function listMovements(limit = 50) {
  ensureInventorySeeded();
  return store().movements.slice(0, limit);
}

export function listMovementsByDoc(sourceDocId: string) {
  ensureInventorySeeded();
  return store().movements.filter((m) => m.sourceDocId === sourceDocId);
}

export function listPurchaseRequests() {
  ensureInventorySeeded();
  return store().purchaseRequests;
}

export function listPurchaseOrders() {
  ensureInventorySeeded();
  return store().purchaseOrders;
}

export function getPurchaseOrder(id: string) {
  ensureInventorySeeded();
  return store().purchaseOrders.find((p) => p.id === id);
}

export function listSuppliers() {
  ensureInventorySeeded();
  return store().suppliers;
}

export function getStockOverview(scopeOutletId?: string) {
  ensureInventorySeeded();
  return getItems().map((item) => {
    const warehouseQty = getStockQty(item.id, WAREHOUSE_ID);
    let outletQty = 0;
    if (scopeOutletId) {
      outletQty = getStockQty(item.id, scopeOutletId);
    } else {
      for (const o of OUTLETS) {
        outletQty += getStockQty(item.id, o.id);
      }
    }
    const totalQty = scopeOutletId ? warehouseQty + outletQty : warehouseQty + outletQty;
    return {
      item,
      warehouseQty,
      outletQty,
      totalQty,
      isCritical: totalQty < item.minStock
    };
  });
}

/** Stok kritis: total di bawah minStock. */
export function getCriticalItems(scopeOutletId?: string): StockRow[] {
  return getStockOverview(scopeOutletId).filter((r) => r.isCritical);
}

export function countCriticalStock(scopeOutletId?: string) {
  return getCriticalItems(scopeOutletId).length;
}

export function receivePurchaseOrder(
  poId: string,
  actualTotal: number,
  receivedBy: string
) {
  const po = getPurchaseOrder(poId);
  if (!po || po.status === "Received") return null;

  po.status = "Received";
  po.totalActual = actualTotal;
  po.updatedAt = new Date().toISOString();

  for (const line of po.items) {
    const item = findItemByName(line.itemName);
    if (!item) continue;
    recordMovement({
      itemId: item.id,
      itemName: item.itemName,
      locationId: WAREHOUSE_ID,
      locationLabel: WAREHOUSE_LABEL,
      movementType: "Stock In",
      qty: line.qty,
      unit: line.unit,
      sourceDocType: "purchase_order",
      sourceDocId: po.id,
      note: `Terima PO ${po.id}`,
      createdBy: receivedBy,
      delta: line.qty
    });
    if (po.outletId) {
      recordMovement({
        itemId: item.id,
        itemName: item.itemName,
        locationId: WAREHOUSE_ID,
        locationLabel: WAREHOUSE_LABEL,
        movementType: "Transfer Out",
        qty: line.qty,
        unit: line.unit,
        sourceDocType: "purchase_order",
        sourceDocId: po.id,
        createdBy: receivedBy,
        delta: -line.qty
      });
      recordMovement({
        itemId: item.id,
        itemName: item.itemName,
        locationId: po.outletId,
        locationLabel: po.outletName ?? po.outletId,
        movementType: "Transfer In",
        qty: line.qty,
        unit: line.unit,
        sourceDocType: "purchase_order",
        sourceDocId: po.id,
        createdBy: receivedBy,
        delta: line.qty
      });
    }
  }
  recordAuditEvent({
    action: "inventory.po_receive",
    actorName: receivedBy,
    outletId: po.outletId,
    entityType: "purchase_order",
    entityId: po.id,
    meta: { actualTotal, lineCount: po.items.length }
  });
  return po;
}

export function markPoPurchased(poId: string) {
  const po = getPurchaseOrder(poId);
  if (!po || po.status !== "Approved") return null;
  po.status = "Purchased";
  po.updatedAt = new Date().toISOString();
  return po;
}

export function stockInManual(input: {
  itemId: string;
  qty: number;
  locationId: string;
  locationLabel: string;
  note?: string;
  createdBy: string;
}) {
  const item = getItem(input.itemId);
  if (!item) return null;
  const movement = recordMovement({
    itemId: item.id,
    itemName: item.itemName,
    locationId: input.locationId,
    locationLabel: input.locationLabel,
    movementType: "Stock In",
    qty: input.qty,
    unit: item.unit,
    sourceDocType: "manual",
    note: input.note,
    createdBy: input.createdBy,
    delta: input.qty
  });
  recordAuditEvent({
    action: "inventory.stock_in",
    actorName: input.createdBy,
    outletId: input.locationId !== WAREHOUSE_ID ? input.locationId : undefined,
    entityType: "stock_movement",
    entityId: movement.id,
    reason: input.note,
    meta: { itemName: item.itemName, qty: input.qty, unit: item.unit }
  });
  return movement;
}
