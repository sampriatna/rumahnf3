/** Promosi default per outlet F&B. */
export const PROMOTION_SEED: Array<{
  outletId: string;
  name: string;
  code?: string;
  promoType: "order_percent" | "order_fixed" | "item_percent";
  value: number;
  targetMenuItemIds?: string[];
  minSubtotal?: number;
}> = [
  {
    outletId: "kbu",
    name: "Diskon 10% Order",
    code: "HEMAT10",
    promoType: "order_percent",
    value: 10,
    minSubtotal: 50_000
  },
  {
    outletId: "kbu",
    name: "Diskon Minuman 15%",
    code: "MINUM15",
    promoType: "item_percent",
    value: 15,
    targetMenuItemIds: ["mi-latte", "mi-cappuccino", "mi-teh-tarik", "mi-matcha"]
  },
  {
    outletId: "kbu",
    name: "Potongan Rp 5rb",
    code: "POTONG5",
    promoType: "order_fixed",
    value: 5_000,
    minSubtotal: 30_000
  }
];
