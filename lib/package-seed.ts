/** Paket bundling default per outlet F&B. */
export const PACKAGE_SEED: Array<{
  outletId: string;
  name: string;
  description?: string;
  bundlePrice: number;
  items: Array<{ menuItemId: string; qty: number }>;
}> = [
  {
    outletId: "kbu",
    name: "Paket Hemat KBU",
    description: "Nasi Goreng + Teh Tarik",
    bundlePrice: 52_000,
    items: [
      { menuItemId: "mi-nasi-goreng", qty: 1 },
      { menuItemId: "mi-teh-tarik", qty: 1 }
    ]
  },
  {
    outletId: "kbu",
    name: "Paket Kopi & Snack",
    description: "Latte + Kentang Goreng",
    bundlePrice: 42_000,
    items: [
      { menuItemId: "mi-latte", qty: 1 },
      { menuItemId: "mi-kentang", qty: 1 }
    ]
  },
  {
    outletId: "kisamen",
    name: "Paket Kisamen",
    description: "Bundling demo outlet Kisamen",
    bundlePrice: 45_000,
    items: [{ menuItemId: "mi-nasi-goreng", qty: 1 }]
  }
];
