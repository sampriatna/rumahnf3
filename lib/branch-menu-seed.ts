/** Override harga/aktif menu katalog KBU di cabang lain. */
export const BRANCH_MENU_SEED: Array<{
  menuItemId: string;
  outletId: string;
  price?: number;
  active?: boolean;
  soldOut?: boolean;
}> = [
  { menuItemId: "mi-latte", outletId: "kisamen", price: 30_000, active: true },
  { menuItemId: "mi-cappuccino", outletId: "kisamen", price: 30_000, active: true },
  { menuItemId: "mi-teh-tarik", outletId: "kisamen", active: true },
  { menuItemId: "mi-nasi-goreng", outletId: "kisamen", price: 38_000, active: true },
  { menuItemId: "mi-mie-goreng", outletId: "kisamen", active: true },
  { menuItemId: "mi-latte", outletId: "samtaro", price: 32_000, active: true },
  { menuItemId: "mi-air-mineral", outletId: "samtaro", active: true }
];

/** Outlet katalog default (menu induk). */
export const DEFAULT_CATALOG_OUTLET = "kbu";
