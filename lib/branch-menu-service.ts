import type { MenuCategory, MenuItem } from "./pos-kds-roadmap";
import { store, persistStore } from "./store";
import { isPosOutlet, POS_OUTLET_IDS } from "./pos-seed";
import { BRANCH_MENU_SEED, DEFAULT_CATALOG_OUTLET } from "./branch-menu-seed";
import { bumpMenuCatalogVersion } from "./catalog-meta";
import { resolveScheduledPrice } from "./price-schedule-service";

export type MenuBranchSetting = {
  menuItemId: string;
  outletId: string;
  /** Kosong = pakai base_price katalog. */
  price?: number;
  active: boolean;
  soldOut: boolean;
};

export type BranchMenuRow = {
  item: MenuItem;
  setting?: MenuBranchSetting;
  catalogPrice: number;
  effectivePrice: number;
  isLinked: boolean;
  isNative: boolean;
};

export type BranchSaveError = "invalid" | "not-found";

export function getDefaultCatalogOutlet() {
  return DEFAULT_CATALOG_OUTLET;
}

export function ensureBranchMenuReady() {
  if (store().menuBranchSettings.length) return;
  bootstrapBranchMenuFromSeed();
}

export function bootstrapBranchMenuFromSeed(outletId?: string) {
  const rows = outletId
    ? BRANCH_MENU_SEED.filter((r) => r.outletId === outletId)
    : BRANCH_MENU_SEED;
  for (const row of rows) {
    upsertBranchSetting({
      menuItemId: row.menuItemId,
      outletId: row.outletId,
      price: row.price,
      active: row.active ?? true,
      soldOut: row.soldOut ?? false
    });
  }
  persistStore();
}

export function resetBranchMenuFromSeed(outletId: string) {
  store().menuBranchSettings = store().menuBranchSettings.filter((b) => b.outletId !== outletId);
  bootstrapBranchMenuFromSeed(outletId);
  bumpMenuCatalogVersion(outletId);
}

export function listBranchSettings(outletId: string): MenuBranchSetting[] {
  return store().menuBranchSettings.filter((b) => b.outletId === outletId);
}

export function getBranchSetting(outletId: string, menuItemId: string): MenuBranchSetting | undefined {
  return store().menuBranchSettings.find((b) => b.outletId === outletId && b.menuItemId === menuItemId);
}

export function upsertBranchSetting(input: {
  menuItemId: string;
  outletId: string;
  price?: number | null;
  active?: boolean;
  soldOut?: boolean;
}):
  | { ok: true; setting: MenuBranchSetting }
  | { ok: false; error: BranchSaveError } {
  if (!isPosOutlet(input.outletId)) return { ok: false, error: "invalid" };
  const item = store().menuItems.find((i) => i.id === input.menuItemId);
  if (!item) return { ok: false, error: "not-found" };

  const price =
    input.price === null || input.price === undefined || Number.isNaN(Number(input.price))
      ? undefined
      : Math.max(0, Math.round(Number(input.price)));

  const existing = getBranchSetting(input.outletId, input.menuItemId);
  const setting: MenuBranchSetting = {
    menuItemId: input.menuItemId,
    outletId: input.outletId,
    price: price ?? existing?.price,
    active: input.active ?? existing?.active ?? true,
    soldOut: input.soldOut ?? existing?.soldOut ?? false
  };

  if (existing) Object.assign(existing, setting);
  else store().menuBranchSettings.push(setting);

  bumpMenuCatalogVersion(input.outletId);
  persistStore();
  return { ok: true, setting };
}

export function toggleBranchItemActive(outletId: string, menuItemId: string, active: boolean) {
  const item = store().menuItems.find((i) => i.id === menuItemId);
  if (!item) return { ok: false as const, error: "not-found" as const };
  return upsertBranchSetting({ menuItemId, outletId, active });
}

export function enableAllCatalogAtBranch(catalogOutletId: string, branchOutletId: string) {
  if (!isPosOutlet(branchOutletId) || catalogOutletId === branchOutletId) {
    return { ok: false as const, error: "invalid" as const, count: 0 };
  }
  let count = 0;
  for (const item of store().menuItems.filter((i) => i.outletId === catalogOutletId && i.active)) {
    const res = upsertBranchSetting({ menuItemId: item.id, outletId: branchOutletId, active: true });
    if (res.ok) count++;
  }
  bumpMenuCatalogVersion(branchOutletId);
  return { ok: true as const, count };
}

export function listBranchMenuRows(catalogOutletId: string, branchOutletId: string): BranchMenuRow[] {
  ensureBranchMenuReady();
  const s = store();
  const nativeIds = new Set(s.menuItems.filter((i) => i.outletId === branchOutletId).map((i) => i.id));

  const catalogItems = s.menuItems
    .filter((i) => i.outletId === catalogOutletId)
    .sort((a, b) => a.name.localeCompare(b.name, "id"));

  const nativeItems = s.menuItems
    .filter((i) => i.outletId === branchOutletId)
    .sort((a, b) => a.name.localeCompare(b.name, "id"));

  const rows: BranchMenuRow[] = [];

  for (const item of nativeItems) {
    const setting = getBranchSetting(branchOutletId, item.id);
    const effectivePrice = setting?.price ?? item.basePrice;
    rows.push({
      item,
      setting,
      catalogPrice: item.basePrice,
      effectivePrice,
      isLinked: false,
      isNative: true
    });
  }

  for (const item of catalogItems) {
    if (nativeIds.has(item.id)) continue;
    const setting = getBranchSetting(branchOutletId, item.id);
    rows.push({
      item,
      setting,
      catalogPrice: item.basePrice,
      effectivePrice: setting?.price ?? item.basePrice,
      isLinked: true,
      isNative: false
    });
  }

  return rows;
}

export function resolveOutletMenuItem(
  raw: MenuItem,
  branchOutletId: string,
  now = new Date()
): MenuItem | null {
  const setting = getBranchSetting(branchOutletId, raw.id);

  let resolved: MenuItem | null = null;
  if (raw.outletId === branchOutletId) {
    if (!raw.active) return null;
    resolved = {
      ...raw,
      basePrice: setting?.price ?? raw.basePrice,
      soldOut: setting?.soldOut ?? raw.soldOut ?? false
    };
  } else if (setting?.active) {
    resolved = {
      ...raw,
      basePrice: setting.price ?? raw.basePrice,
      soldOut: setting.soldOut ?? false,
      active: true
    };
  }

  if (!resolved) return null;
  resolved = {
    ...resolved,
    basePrice: resolveScheduledPrice(resolved.basePrice, resolved, branchOutletId, now)
  };
  return resolved;
}

export function buildOutletMenu(outletId: string): { categories: MenuCategory[]; items: MenuItem[] } {
  ensureBranchMenuReady();
  const s = store();
  const itemMap = new Map<string, MenuItem>();

  for (const raw of s.menuItems) {
    if (raw.outletId !== outletId) continue;
    const resolved = resolveOutletMenuItem(raw, outletId);
    if (resolved) itemMap.set(resolved.id, resolved);
  }

  for (const setting of s.menuBranchSettings) {
    if (setting.outletId !== outletId || !setting.active) continue;
    const raw = s.menuItems.find((i) => i.id === setting.menuItemId);
    if (!raw || raw.outletId === outletId) continue;
    const resolved = resolveOutletMenuItem(raw, outletId);
    if (resolved) itemMap.set(resolved.id, resolved);
  }

  const items = [...itemMap.values()].filter((i) => i.active);

  const nativeCats = s.menuCategories.filter((c) => c.outletId === outletId && c.active);
  const itemCatIds = new Set(items.map((i) => i.categoryId).filter(Boolean) as string[]);
  const nativeCatIds = new Set(nativeCats.map((c) => c.id));
  const linkedCats = s.menuCategories.filter(
    (c) => c.outletId !== outletId && c.active && itemCatIds.has(c.id) && !nativeCatIds.has(c.id)
  );

  const categories = [...nativeCats, ...linkedCats].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id")
  );

  return { categories, items };
}

export function getMenuItemForOutlet(menuItemId: string, outletId: string): MenuItem | undefined {
  const raw = store().menuItems.find((i) => i.id === menuItemId);
  if (!raw) return undefined;
  return resolveOutletMenuItem(raw, outletId) ?? undefined;
}

export function listPosOutletIds(): string[] {
  return [...POS_OUTLET_IDS];
}
