import type { MenuCategory, MenuItem, PosRegister } from "./pos-kds-roadmap";
import { DEMO_MENU_IMAGES } from "./menu-images";
import { DEFAULT_REGISTER_SETTINGS, normalizeRegisterSettings } from "./pos-register-settings";

/** Register kasir demo per outlet F&B. */
export function seedPosRegisters(): PosRegister[] {
  const withSettings = (r: Omit<PosRegister, "settings">): PosRegister => ({
    ...r,
    settings: { ...DEFAULT_REGISTER_SETTINGS }
  });
  return [
    withSettings({ id: "reg-kbu-1", outletId: "kbu", code: "KASIR-1", name: "Kasir Utama KBU", active: true }),
    withSettings({ id: "reg-ksm-1", outletId: "kisamen", code: "KASIR-1", name: "Kasir Kisamen", active: true }),
    withSettings({ id: "reg-smt-1", outletId: "samtaro", code: "KASIR-1", name: "Kasir Samtaro", active: true })
  ];
}

/** Menu demo KBU — harga per outlet (Fase 7a seed in-memory). */
export function seedMenuCategories(): MenuCategory[] {
  return [
    { id: "cat-kbu-kopi", outletId: "kbu", name: "Kopi", sortOrder: 1, active: true },
    { id: "cat-kbu-minum", outletId: "kbu", name: "Non-Kopi", sortOrder: 2, active: true },
    { id: "cat-kbu-makan", outletId: "kbu", name: "Makanan", sortOrder: 3, active: true },
    { id: "cat-kbu-snack", outletId: "kbu", name: "Snack", sortOrder: 4, active: true }
  ];
}

function withImage(item: MenuItem): MenuItem {
  return { ...item, imageUrl: item.imageUrl ?? DEMO_MENU_IMAGES[item.id] };
}

export function seedMenuItems(): MenuItem[] {
  const bar = "bar";
  const dapur = "dapur";
  return [
    withImage({ id: "mi-espresso", outletId: "kbu", categoryId: "cat-kbu-kopi", name: "Espresso", basePrice: 18_000, taxIncluded: true, defaultAreaId: bar, prepTimeMinutes: 3, active: true }),
    withImage({ id: "mi-latte", outletId: "kbu", categoryId: "cat-kbu-kopi", name: "Latte", basePrice: 28_000, taxIncluded: true, defaultAreaId: bar, prepTimeMinutes: 4, active: true }),
    withImage({ id: "mi-cappuccino", outletId: "kbu", categoryId: "cat-kbu-kopi", name: "Cappuccino", basePrice: 28_000, taxIncluded: true, defaultAreaId: bar, prepTimeMinutes: 4, active: true }),
    withImage({ id: "mi-v60", outletId: "kbu", categoryId: "cat-kbu-kopi", name: "V60 Manual Brew", basePrice: 32_000, taxIncluded: true, defaultAreaId: bar, prepTimeMinutes: 6, active: true }),
    withImage({ id: "mi-teh-tarik", outletId: "kbu", categoryId: "cat-kbu-minum", name: "Teh Tarik", basePrice: 22_000, taxIncluded: true, defaultAreaId: bar, prepTimeMinutes: 4, active: true }),
    withImage({ id: "mi-matcha", outletId: "kbu", categoryId: "cat-kbu-minum", name: "Matcha Latte", basePrice: 30_000, taxIncluded: true, defaultAreaId: bar, prepTimeMinutes: 4, active: true }),
    withImage({ id: "mi-air-mineral", outletId: "kbu", categoryId: "cat-kbu-minum", name: "Air Mineral", basePrice: 8_000, taxIncluded: true, defaultAreaId: bar, prepTimeMinutes: 1, active: true }),
    withImage({ id: "mi-nasi-goreng", outletId: "kbu", categoryId: "cat-kbu-makan", name: "Nasi Goreng KBU", basePrice: 35_000, taxIncluded: true, defaultAreaId: dapur, prepTimeMinutes: 12, active: true }),
    withImage({ id: "mi-mie-goreng", outletId: "kbu", categoryId: "cat-kbu-makan", name: "Mie Goreng", basePrice: 32_000, taxIncluded: true, defaultAreaId: dapur, prepTimeMinutes: 10, active: true }),
    withImage({ id: "mi-sate-ayam", outletId: "kbu", categoryId: "cat-kbu-makan", name: "Sate Ayam (10 tusuk)", basePrice: 38_000, taxIncluded: true, defaultAreaId: dapur, prepTimeMinutes: 15, active: true }),
    withImage({ id: "mi-kentang", outletId: "kbu", categoryId: "cat-kbu-snack", name: "Kentang Goreng", basePrice: 20_000, taxIncluded: true, defaultAreaId: dapur, prepTimeMinutes: 8, active: true }),
    withImage({ id: "mi-pisang", outletId: "kbu", categoryId: "cat-kbu-snack", name: "Pisang Goreng", basePrice: 15_000, taxIncluded: true, defaultAreaId: dapur, prepTimeMinutes: 8, active: true })
  ];
}

export type { KdsStation } from "./station-service";

export function seedKdsStations(): import("./station-service").KdsStation[] {
  const outlets = ["kbu", "kisamen", "samtaro"];
  const stations = [
    { id: "dapur", name: "Dapur" },
    { id: "bar", name: "Bar" },
    { id: "packing", name: "Packing" }
  ];
  return outlets.flatMap((outletId) =>
    stations.map((st, i) => ({ id: st.id, outletId, name: st.name, sortOrder: i + 1, active: true }))
  );
}

/** Tentukan station KDS dari menu item. */
export function resolveKdsStation(menuItem: MenuItem, channel?: string): string {
  if (menuItem.defaultAreaId) return menuItem.defaultAreaId;
  if (menuItem.categoryId === "cat-kbu-makan" || menuItem.categoryId === "cat-kbu-snack") {
    return "dapur";
  }
  if (menuItem.categoryId === "cat-kbu-minum" || menuItem.categoryId === "cat-kbu-kopi") {
    return "bar";
  }
  if (channel === "takeaway" || channel === "gofood" || channel === "grab" || channel === "shopee") {
    return "packing";
  }
  return "bar";
}

/** Outlet yang punya POS (F&B). */
export const POS_OUTLET_IDS = new Set(["kbu", "kisamen", "samtaro"]);

export function isPosOutlet(outletId?: string) {
  return outletId != null && POS_OUTLET_IDS.has(outletId);
}
