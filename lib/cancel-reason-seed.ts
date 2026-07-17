/** Alasan void default per outlet F&B. */
export const CANCEL_REASON_SEED: Array<{
  outletId: string;
  name: string;
  scope?: "order" | "item" | "all";
  requiresNote?: boolean;
}> = [
  { outletId: "kbu", name: "Salah input kasir", scope: "all" },
  { outletId: "kbu", name: "Pelanggan batal", scope: "all" },
  { outletId: "kbu", name: "Item tidak tersedia", scope: "item" },
  { outletId: "kbu", name: "Double order", scope: "order" },
  { outletId: "kbu", name: "Training / uji coba", scope: "order" },
  { outletId: "kbu", name: "Lainnya", scope: "all", requiresNote: true },
  { outletId: "kisamen", name: "Salah input kasir", scope: "all" },
  { outletId: "kisamen", name: "Pelanggan batal", scope: "all" },
  { outletId: "kisamen", name: "Item tidak tersedia", scope: "item" },
  { outletId: "kisamen", name: "Lainnya", scope: "all", requiresNote: true },
  { outletId: "samtaro", name: "Salah input kasir", scope: "all" },
  { outletId: "samtaro", name: "Pelanggan batal", scope: "all" },
  { outletId: "samtaro", name: "Lainnya", scope: "all", requiresNote: true }
];
