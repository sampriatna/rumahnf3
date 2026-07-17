// Master barang & pergerakan stok. Lokasi: 'warehouse' (gudang pusat) atau outlet_id.

export type MovementType =
  | "Stock In"
  | "Stock Out"
  | "Transfer In"
  | "Transfer Out"
  | "Waste"
  | "Adjustment"
  | "Opname Correction";

export type Item = {
  id: string;
  itemName: string;
  category: string;
  unit: string;
  minStock: number;
  lastPurchasePrice: number;
  supplierId?: string;
  active: boolean;
};

export type StockMovement = {
  id: string;
  itemId: string;
  itemName: string;
  /** 'warehouse' atau outlet id (kbu, samtaro, ...) */
  locationId: string;
  locationLabel: string;
  movementType: MovementType;
  qty: number;
  unit: string;
  sourceDocType?: string;
  sourceDocId?: string;
  note?: string;
  createdBy: string;
  createdAt: string;
};

export const WAREHOUSE_ID = "warehouse";
export const WAREHOUSE_LABEL = "Gudang Pusat";

export function stockKey(itemId: string, locationId: string) {
  return `${itemId}:${locationId}`;
}

export function normalizeItemName(name: string) {
  return name.trim().toLowerCase();
}

/** Seed master barang — F&B + NF. */
export function seedItems(): Item[] {
  return [
    { id: "it-ayam", itemName: "Ayam", category: "Bahan Dapur", unit: "kg", minStock: 20, lastPurchasePrice: 38000, supplierId: "sup-1", active: true },
    { id: "it-susu", itemName: "Susu UHT", category: "Bar", unit: "liter", minStock: 10, lastPurchasePrice: 18000, supplierId: "sup-1", active: true },
    { id: "it-kopi", itemName: "Kopi Bubuk", category: "Bar", unit: "kg", minStock: 5, lastPurchasePrice: 95000, supplierId: "sup-2", active: true },
    { id: "it-cup", itemName: "Cup 16oz", category: "Packaging", unit: "pack", minStock: 30, lastPurchasePrice: 45000, supplierId: "sup-3", active: true },
    { id: "it-beras", itemName: "Beras", category: "Bahan Dapur", unit: "kg", minStock: 25, lastPurchasePrice: 14000, supplierId: "sup-1", active: true },
    { id: "it-minyak", itemName: "Minyak Goreng", category: "Bahan Dapur", unit: "liter", minStock: 15, lastPurchasePrice: 16000, supplierId: "sup-1", active: true },
    { id: "it-umpan", itemName: "Umpan NF Premium", category: "Produk NF", unit: "pack", minStock: 50, lastPurchasePrice: 12000, supplierId: "sup-4", active: true }
  ];
}

/** Stok awal demo. */
export function seedStock(): Record<string, number> {
  const s: Record<string, number> = {};
  const set = (itemId: string, loc: string, qty: number) => {
    s[stockKey(itemId, loc)] = qty;
  };
  set("it-ayam", WAREHOUSE_ID, 45);
  set("it-ayam", "kbu", 8);
  set("it-susu", WAREHOUSE_ID, 12);
  set("it-susu", "kbu", 3);
  set("it-cup", WAREHOUSE_ID, 25);
  set("it-cup", "kbu", 5);
  set("it-kopi", WAREHOUSE_ID, 8);
  set("it-beras", WAREHOUSE_ID, 40);
  set("it-minyak", WAREHOUSE_ID, 18);
  set("it-umpan", WAREHOUSE_ID, 120);
  set("it-umpan", "nf-prod", 30);
  return s;
}

export type StockRow = {
  item: Item;
  warehouseQty: number;
  outletQty: number;
  totalQty: number;
  isCritical: boolean;
};

export function locationLabel(locationId: string, outletName?: string) {
  if (locationId === WAREHOUSE_ID) return WAREHOUSE_LABEL;
  return outletName ?? locationId;
}
