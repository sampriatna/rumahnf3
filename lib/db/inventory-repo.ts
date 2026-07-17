import { supabaseAdmin } from "../supabase";
import { stockKey } from "../inventory";
import type { Item, StockMovement } from "../inventory";
import type { Supplier, PurchaseRequest, PurchaseOrder } from "../purchasing";
import type { StockTransferRequest } from "../transfer";

// ============================================================================
// Repository relasional Inventory + Purchasing (Fase D2b lanjutan).
// Stok app = Record<"itemId:locationId", qty> ↔ baris stock_levels.
// Pull sekuensial (bukan Promise.all) — andal setelah DDL PostgREST.
// ============================================================================

export type InventorySnapshot = {
  items: Item[];
  stock: Record<string, number>;
  movements: StockMovement[];
  suppliers: Supplier[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
  stockTransferRequests: StockTransferRequest[];
};

const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const num = (v: unknown): number => (v == null ? 0 : Number(v));
const numU = (v: unknown): number | undefined => (v == null ? undefined : Number(v));

// ---- map: app -> row -------------------------------------------------------
const supplierRow = (s: Supplier) => ({
  id: s.id, name: s.name, phone: n(s.phone), active: s.active
});

const itemRow = (i: Item) => ({
  id: i.id,
  item_name: i.itemName,
  category: i.category,
  unit: i.unit,
  min_stock: i.minStock,
  last_purchase_price: i.lastPurchasePrice,
  supplier_id: n(i.supplierId),
  active: i.active
});

const stockRows = (stock: Record<string, number>) =>
  Object.entries(stock).map(([key, qty]) => {
    const ci = key.indexOf(":");
    const itemId = ci >= 0 ? key.slice(0, ci) : key;
    const locationId = ci >= 0 ? key.slice(ci + 1) : "warehouse";
    return { item_id: itemId, location_id: locationId, qty };
  });

const movementRow = (m: StockMovement) => ({
  id: m.id,
  item_id: m.itemId,
  item_name: m.itemName,
  location_id: m.locationId,
  location_label: m.locationLabel,
  movement_type: m.movementType,
  qty: m.qty,
  unit: m.unit,
  source_doc_type: n(m.sourceDocType),
  source_doc_id: n(m.sourceDocId),
  note: n(m.note),
  created_by: m.createdBy,
  created_at: m.createdAt
});

const purchaseRequestRow = (pr: PurchaseRequest) => ({
  id: pr.id,
  submission_id: pr.submissionId,
  item_name: pr.itemName,
  qty: pr.qty,
  unit: pr.unit,
  outlet_id: n(pr.outletId),
  outlet_name: n(pr.outletName),
  urgency: pr.urgency,
  requested_by: pr.requestedBy,
  status: pr.status,
  created_at: pr.createdAt
});

const purchaseOrderRow = (po: PurchaseOrder) => ({
  id: po.id,
  supplier_id: po.supplierId,
  supplier_name: po.supplierName,
  purchase_request_id: n(po.purchaseRequestId),
  requested_by: po.requestedBy,
  outlet_id: n(po.outletId),
  outlet_name: n(po.outletName),
  items: po.items ?? [],
  total_estimated: po.totalEstimated,
  total_actual: n(po.totalActual),
  payment_method: n(po.paymentMethod),
  payment_status: po.paymentStatus,
  status: po.status,
  note: n(po.note),
  created_at: po.createdAt,
  updated_at: po.updatedAt
});

const transferRow = (tr: StockTransferRequest) => ({
  id: tr.id,
  request_number: tr.requestNumber,
  from_location_id: tr.fromLocationId,
  from_location_label: tr.fromLocationLabel,
  to_outlet_id: tr.toOutletId,
  to_outlet_name: n(tr.toOutletName),
  status: tr.status,
  items: tr.items ?? [],
  requested_by_id: tr.requestedById,
  requested_by_name: tr.requestedByName,
  note: n(tr.note),
  approved_by_id: n(tr.approvedById),
  approved_by_name: n(tr.approvedByName),
  approved_at: n(tr.approvedAt),
  sent_by_id: n(tr.sentById),
  sent_by_name: n(tr.sentByName),
  sent_at: n(tr.sentAt),
  received_by_id: n(tr.receivedById),
  received_by_name: n(tr.receivedByName),
  received_at: n(tr.receivedAt),
  rejection_note: n(tr.rejectionNote),
  created_at: tr.createdAt,
  updated_at: tr.updatedAt
});

// ---- map: row -> app -------------------------------------------------------
const toSupplier = (r: any): Supplier => ({
  id: r.id, name: r.name, phone: u(r.phone), active: r.active
});

const toItem = (r: any): Item => ({
  id: r.id,
  itemName: r.item_name,
  category: r.category,
  unit: r.unit,
  minStock: num(r.min_stock),
  lastPurchasePrice: num(r.last_purchase_price),
  supplierId: u(r.supplier_id),
  active: r.active
});

const stockFromRows = (rows: any[]): Record<string, number> => {
  const s: Record<string, number> = {};
  for (const r of rows) {
    s[stockKey(r.item_id, r.location_id)] = num(r.qty);
  }
  return s;
};

const toMovement = (r: any): StockMovement => ({
  id: r.id,
  itemId: r.item_id,
  itemName: r.item_name,
  locationId: r.location_id,
  locationLabel: r.location_label,
  movementType: r.movement_type,
  qty: num(r.qty),
  unit: r.unit,
  sourceDocType: u(r.source_doc_type),
  sourceDocId: u(r.source_doc_id),
  note: u(r.note),
  createdBy: r.created_by,
  createdAt: r.created_at
});

const toPurchaseRequest = (r: any): PurchaseRequest => ({
  id: r.id,
  submissionId: r.submission_id,
  itemName: r.item_name,
  qty: num(r.qty),
  unit: r.unit,
  outletId: u(r.outlet_id),
  outletName: u(r.outlet_name),
  urgency: r.urgency,
  requestedBy: r.requested_by,
  status: r.status,
  createdAt: r.created_at
});

const toPurchaseOrder = (r: any): PurchaseOrder => ({
  id: r.id,
  supplierId: r.supplier_id,
  supplierName: r.supplier_name,
  purchaseRequestId: u(r.purchase_request_id),
  requestedBy: r.requested_by,
  outletId: u(r.outlet_id),
  outletName: u(r.outlet_name),
  items: Array.isArray(r.items) ? r.items : [],
  totalEstimated: num(r.total_estimated),
  totalActual: numU(r.total_actual),
  paymentMethod: u(r.payment_method),
  paymentStatus: r.payment_status,
  status: r.status,
  note: u(r.note),
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

const toTransfer = (r: any): StockTransferRequest => ({
  id: r.id,
  requestNumber: r.request_number,
  fromLocationId: r.from_location_id,
  fromLocationLabel: r.from_location_label,
  toOutletId: r.to_outlet_id,
  toOutletName: u(r.to_outlet_name),
  status: r.status,
  items: Array.isArray(r.items) ? r.items : [],
  requestedById: r.requested_by_id,
  requestedByName: r.requested_by_name,
  note: u(r.note),
  approvedById: u(r.approved_by_id),
  approvedByName: u(r.approved_by_name),
  approvedAt: u(r.approved_at),
  sentById: u(r.sent_by_id),
  sentByName: u(r.sent_by_name),
  sentAt: u(r.sent_at),
  receivedById: u(r.received_by_id),
  receivedByName: u(r.received_by_name),
  receivedAt: u(r.received_at),
  rejectionNote: u(r.rejection_note),
  createdAt: r.created_at,
  updatedAt: r.updated_at
});

const COLS = {
  suppliers:
    "id,name,phone,active",
  inventory_items:
    "id,item_name,category,unit,min_stock,last_purchase_price,supplier_id,active",
  stock_levels:
    "item_id,location_id,qty",
  stock_movements:
    "id,item_id,item_name,location_id,location_label,movement_type,qty,unit,source_doc_type,source_doc_id,note,created_by,created_at",
  purchase_requests:
    "id,submission_id,item_name,qty,unit,outlet_id,outlet_name,urgency,requested_by,status,created_at",
  purchase_orders:
    "id,supplier_id,supplier_name,purchase_request_id,requested_by,outlet_id,outlet_name,items,total_estimated,total_actual,payment_method,payment_status,status,note,created_at,updated_at",
  stock_transfer_requests:
    "id,request_number,from_location_id,from_location_label,to_outlet_id,to_outlet_name,status,items,requested_by_id,requested_by_name,note,approved_by_id,approved_by_name,approved_at,sent_by_id,sent_by_name,sent_at,received_by_id,received_by_name,received_at,rejection_note,created_at,updated_at"
} as const;

/** Tulis seluruh state inventory ke tabel relasional (idempotent). */
export async function pushInventory(snap: InventorySnapshot): Promise<void> {
  try {
    const db = supabaseAdmin();
    // Urutan FK: suppliers → items → stock/movements → PO.
    if (snap.suppliers.length) {
      await db.from("suppliers").upsert(snap.suppliers.map(supplierRow) as never[], { onConflict: "id" });
    }
    if (snap.items.length) {
      await db.from("inventory_items").upsert(snap.items.map(itemRow) as never[], { onConflict: "id" });
    }
    const levels = stockRows(snap.stock);
    if (levels.length) {
      await db.from("stock_levels").upsert(levels as never[], { onConflict: "item_id,location_id" });
    }
    if (snap.movements.length) {
      await db.from("stock_movements").upsert(snap.movements.map(movementRow) as never[], { onConflict: "id" });
    }
    if (snap.purchaseRequests.length) {
      await db.from("purchase_requests").upsert(snap.purchaseRequests.map(purchaseRequestRow) as never[], { onConflict: "id" });
    }
    if (snap.purchaseOrders.length) {
      await db.from("purchase_orders").upsert(snap.purchaseOrders.map(purchaseOrderRow) as never[], { onConflict: "id" });
    }
    if (snap.stockTransferRequests?.length) {
      await db.from("stock_transfer_requests").upsert(snap.stockTransferRequests.map(transferRow) as never[], { onConflict: "id" });
    }
  } catch {
    /* abaikan — relasional opsional */
  }
}

/** Baca seluruh state inventory dari relasional. null bila belum ada data. */
export async function pullInventory(): Promise<InventorySnapshot | null> {
  try {
    const db = supabaseAdmin();
    const sel = async (t: keyof typeof COLS) => {
      const { data, error } = await db.from(t).select(COLS[t], { count: "exact" });
      if (error) return [] as any[];
      return (data ?? []) as any[];
    };
    const itemsRows = await sel("inventory_items");
    if (itemsRows.length === 0) return null;
    const suppliers = await sel("suppliers");
    const levels = await sel("stock_levels");
    const movements = await sel("stock_movements");
    const purchaseRequests = await sel("purchase_requests");
    const purchaseOrders = await sel("purchase_orders");
    const transfers = await sel("stock_transfer_requests");
    return {
      items: itemsRows.map(toItem),
      stock: stockFromRows(levels),
      movements: movements.map(toMovement),
      suppliers: suppliers.map(toSupplier),
      purchaseRequests: purchaseRequests.map(toPurchaseRequest),
      purchaseOrders: purchaseOrders.map(toPurchaseOrder),
      stockTransferRequests: transfers.map(toTransfer)
    };
  } catch {
    return null;
  }
}
