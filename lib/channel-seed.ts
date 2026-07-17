import type { SalesChannelKind } from "./channel-service";

/** Channel penjualan default per outlet F&B. */
export const CHANNEL_SEED: Array<{
  outletId: string;
  id: string;
  name: string;
  kind: SalesChannelKind;
  requiresTable?: boolean;
  isDefault?: boolean;
}> = [
  { outletId: "kbu", id: "dine_in", name: "Dine In", kind: "dine_in", requiresTable: true, isDefault: true },
  { outletId: "kbu", id: "takeaway", name: "Takeaway", kind: "takeaway" },
  { outletId: "kbu", id: "delivery_own", name: "Pesan Antar", kind: "delivery_own" },
  { outletId: "kbu", id: "gofood", name: "GoFood", kind: "platform" },
  { outletId: "kbu", id: "grab", name: "GrabFood", kind: "platform" },
  { outletId: "kbu", id: "shopee", name: "ShopeeFood", kind: "platform" },
  { outletId: "kisamen", id: "dine_in", name: "Dine In", kind: "dine_in", requiresTable: true, isDefault: true },
  { outletId: "kisamen", id: "takeaway", name: "Takeaway", kind: "takeaway" },
  { outletId: "kisamen", id: "delivery_own", name: "Pesan Antar", kind: "delivery_own" },
  { outletId: "kisamen", id: "gofood", name: "GoFood", kind: "platform" },
  { outletId: "samtaro", id: "takeaway", name: "Takeaway", kind: "takeaway", isDefault: true },
  { outletId: "samtaro", id: "wholesale", name: "Grosir", kind: "wholesale" },
  { outletId: "samtaro", id: "production", name: "Produksi Internal", kind: "production" }
];
