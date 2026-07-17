import type { MenuCategory, MenuItem } from "./pos-kds-roadmap";
import { store, nextId, persistStore } from "./store";
import { getMenuForOutlet } from "./pos-service";
import { bumpMenuCatalogVersion } from "./catalog-meta";
export { calcMenuMargin } from "./menu-margin";

export type MenuSaveError = "duplicate-name" | "invalid" | "not-found";

export type MenuItemSaveResult =
  | { ok: true; item: MenuItem }
  | { ok: false; error: MenuSaveError };

export type MenuCategorySaveResult =
  | { ok: true; category: MenuCategory }
  | { ok: false; error: MenuSaveError };

/** Kategori default saat outlet baru pertama kali diisi (mirip template Moka). */
const DEFAULT_CATEGORY_NAMES = ["Kopi", "Minuman", "Makanan", "Snack"] as const;

function ensureCatalogLoaded(outletId: string) {
  getMenuForOutlet(outletId);
}

/** Simpan katalog menu ke disk + Supabase segera setelah edit. */
export function persistMenuCatalog(outletId?: string) {
  if (outletId) bumpMenuCatalogVersion(outletId);
  persistStore();
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function findDuplicateItem(outletId: string, name: string, excludeId?: string) {
  const key = normalizeName(name).toLowerCase();
  return store().menuItems.find(
    (i) =>
      i.outletId === outletId &&
      i.id !== excludeId &&
      normalizeName(i.name).toLowerCase() === key
  );
}

function findDuplicateCategory(outletId: string, name: string, excludeId?: string) {
  const key = normalizeName(name).toLowerCase();
  return store().menuCategories.find(
    (c) =>
      c.outletId === outletId &&
      c.id !== excludeId &&
      normalizeName(c.name).toLowerCase() === key
  );
}

/** Buat kategori dasar bila outlet belum punya menu (Kisamen, Samtaro, dll.). */
export function bootstrapOutletMenu(outletId: string): MenuCategory[] {
  ensureCatalogLoaded(outletId);
  const existing = store().menuCategories.filter((c) => c.outletId === outletId);
  if (existing.length > 0) return existing;

  const created: MenuCategory[] = [];
  for (let i = 0; i < DEFAULT_CATEGORY_NAMES.length; i++) {
    const res = upsertMenuCategory({
      outletId,
      name: DEFAULT_CATEGORY_NAMES[i],
      sortOrder: i + 1,
      active: true
    });
    if (res.ok) created.push(res.category);
  }
  persistMenuCatalog(outletId);
  return created;
}

export function listMenuCategories(outletId: string, includeInactive = false): MenuCategory[] {
  ensureCatalogLoaded(outletId);
  return store()
    .menuCategories.filter((c) => c.outletId === outletId && (includeInactive || c.active))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function listMenuItems(outletId: string, includeInactive = false): MenuItem[] {
  ensureCatalogLoaded(outletId);
  return store()
    .menuItems.filter((i) => i.outletId === outletId && (includeInactive || i.active))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function getMenuCategory(id: string) {
  ensureCatalogLoaded("kbu");
  return store().menuCategories.find((c) => c.id === id);
}

export function upsertMenuItem(input: {
  id?: string;
  outletId: string;
  categoryId?: string;
  sku?: string;
  name: string;
  description?: string;
  imageUrl?: string;
  basePrice: number;
  costPrice?: number;
  soldOut?: boolean;
  defaultAreaId?: string;
  prepTimeMinutes?: number;
  active?: boolean;
}): MenuItemSaveResult {
  ensureCatalogLoaded(input.outletId);

  const name = normalizeName(input.name);
  if (!name || input.basePrice < 0 || Number.isNaN(input.basePrice)) {
    return { ok: false, error: "invalid" };
  }

  const s = store();
  const existing = input.id ? s.menuItems.find((i) => i.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  if (findDuplicateItem(input.outletId, name, existing?.id)) {
    return { ok: false, error: "duplicate-name" };
  }

  const imageUrl = input.imageUrl?.trim() || undefined;
  const categoryId = input.categoryId || undefined;

  const item: MenuItem = {
    id: existing?.id ?? nextId("mi"),
    outletId: input.outletId,
    categoryId,
    sku: input.sku?.trim() || undefined,
    name,
    description: input.description?.trim() || undefined,
    imageUrl,
    basePrice: Math.max(0, Math.round(input.basePrice)),
    costPrice:
      input.costPrice != null && !Number.isNaN(input.costPrice)
        ? Math.max(0, Math.round(input.costPrice))
        : undefined,
    soldOut: input.soldOut ?? existing?.soldOut ?? false,
    taxIncluded: existing?.taxIncluded ?? true,
    defaultAreaId: input.defaultAreaId || existing?.defaultAreaId || guessStation(categoryId),
    prepTimeMinutes: input.prepTimeMinutes ?? existing?.prepTimeMinutes,
    active: input.active ?? true
  };

  if (existing) {
    const idx = s.menuItems.findIndex((i) => i.id === existing.id);
    s.menuItems[idx] = item;
  } else {
    s.menuItems.push(item);
  }

  persistMenuCatalog(input.outletId);
  return { ok: true, item };
}

function guessStation(categoryId?: string): string {
  if (!categoryId) return "bar";
  const cat = store().menuCategories.find((c) => c.id === categoryId);
  const n = cat?.name.toLowerCase() ?? "";
  if (n.includes("makan") || n.includes("snack") || n.includes("food")) return "dapur";
  return "bar";
}

export function toggleMenuItemActive(id: string, active: boolean): MenuItem | null {
  ensureCatalogLoaded("kbu");
  const item = store().menuItems.find((i) => i.id === id);
  if (!item) return null;
  item.active = active;
  persistMenuCatalog(item.outletId);
  return item;
}

export function toggleMenuItemSoldOut(id: string, soldOut: boolean): MenuItem | null {
  ensureCatalogLoaded("kbu");
  const item = store().menuItems.find((i) => i.id === id);
  if (!item) return null;
  item.soldOut = soldOut;
  persistMenuCatalog(item.outletId);
  return item;
}

export function upsertMenuCategory(input: {
  id?: string;
  outletId: string;
  name: string;
  sortOrder?: number;
  active?: boolean;
}): MenuCategorySaveResult {
  ensureCatalogLoaded(input.outletId);

  const name = normalizeName(input.name);
  if (!name) return { ok: false, error: "invalid" };

  const s = store();
  const existing = input.id ? s.menuCategories.find((c) => c.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  if (findDuplicateCategory(input.outletId, name, existing?.id)) {
    return { ok: false, error: "duplicate-name" };
  }

  const maxSort = s.menuCategories
    .filter((c) => c.outletId === input.outletId)
    .reduce((m, c) => Math.max(m, c.sortOrder), 0);

  const cat: MenuCategory = {
    id: existing?.id ?? nextId("cat"),
    outletId: input.outletId,
    name,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? maxSort + 1,
    active: input.active ?? true
  };

  if (existing) {
    const idx = s.menuCategories.findIndex((c) => c.id === existing.id);
    s.menuCategories[idx] = cat;
  } else {
    s.menuCategories.push(cat);
  }

  persistMenuCatalog(input.outletId);
  return { ok: true, category: cat };
}

export function toggleMenuCategoryActive(id: string, active: boolean): MenuCategory | null {
  ensureCatalogLoaded("kbu");
  const cat = store().menuCategories.find((c) => c.id === id);
  if (!cat) return null;
  cat.active = active;
  persistMenuCatalog(cat.outletId);
  return cat;
}

export function ensureMenuLibraryReady(outletId: string) {
  ensureCatalogLoaded(outletId);
  if (listMenuCategories(outletId, true).length === 0) {
    bootstrapOutletMenu(outletId);
  }
}
