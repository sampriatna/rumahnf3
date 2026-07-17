/** Konstanta UI meja — aman untuk client components (tanpa fs/store). */

export type TableStatus = "empty" | "open" | "held" | "partial";

/** Shape tampilan meja di floor plan (subset FloorTableState server). */
export type FloorTableView = {
  id: string;
  label: string;
  seats: number;
  zone: string;
  status: TableStatus;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  pendingKitchen?: number;
};

export const TABLE_STATUS_STYLE: Record<
  TableStatus,
  { bg: string; ring: string; label: string }
> = {
  empty: { bg: "bg-slate-50", ring: "ring-slate-200", label: "Kosong" },
  open: { bg: "bg-emerald-50", ring: "ring-emerald-300", label: "Terisi" },
  held: { bg: "bg-amber-50", ring: "ring-amber-300", label: "Hold" },
  partial: { bg: "bg-blue-50", ring: "ring-blue-300", label: "Partial bayar" }
};
