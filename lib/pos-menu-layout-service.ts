import type { MenuCategory, MenuItem } from "./pos-kds-roadmap";
import { store, nextId, persistStore } from "./store";
import { isPosOutlet } from "./pos-seed";
import { POS_MENU_LAYOUT_SEED } from "./pos-menu-layout-seed";
import type {
  AppliedPosMenuLayout,
  PosMenuLayoutColumns,
  PosMenuLayoutViewMode
} from "./pos-menu-layout-types";

export type { AppliedPosMenuLayout, PosMenuLayoutColumns, PosMenuLayoutViewMode };

export type PosMenuLayout = {
  id: string;
  outletId: string;
  name: string;
  columns: PosMenuLayoutColumns;
  viewMode: PosMenuLayoutViewMode;
  showPackages: boolean;
  categoryOrder: string[];
  hiddenCategoryIds: string[];
  itemOrderByCategory: Record<string, string[]>;
  pinnedItemIds: string[];
  sortOrder: number;
  active: boolean;
};

export type PosMenuLayoutSaveError = "duplicate" | "invalid" | "not-found";
function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function clampColumns(n: number): PosMenuLayoutColumns {
  if (n <= 2) return 2;
  if (n >= 4) return 4;
  return 3;
}

export function ensurePosMenuLayoutsReady(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  const has = store().posMenuLayouts.some((l) => l.outletId === outletId);
  if (!has) bootstrapPosMenuLayoutsFromSeed(outletId);
}

export function bootstrapPosMenuLayoutsFromSeed(outletId?: string) {
  const rows = outletId
    ? POS_MENU_LAYOUT_SEED.filter((r) => r.outletId === outletId)
    : POS_MENU_LAYOUT_SEED;

  rows.forEach((row, i) => {
    upsertPosMenuLayout({
      outletId: row.outletId,
      name: row.name,
      columns: row.columns ?? 3,
      viewMode: row.viewMode ?? "tabs",
      showPackages: row.showPackages ?? true,
      categoryOrder: row.categoryOrder ?? [],
      hiddenCategoryIds: row.hiddenCategoryIds ?? [],
      itemOrderByCategory: {},
      pinnedItemIds: row.pinnedItemIds ?? [],
      sortOrder: i + 1,
      active: true
    });
  });
  persistStore();
}

export function resetPosMenuLayoutsFromSeed(outletId: string) {
  store().posMenuLayouts = store().posMenuLayouts.filter((l) => l.outletId !== outletId);
  bootstrapPosMenuLayoutsFromSeed(outletId);
}

export function listPosMenuLayouts(outletId: string, includeInactive = false): PosMenuLayout[] {
  ensurePosMenuLayoutsReady(outletId);
  return store()
    .posMenuLayouts.filter((l) => {
      if (l.outletId !== outletId) return false;
      if (!includeInactive && !l.active) return false;
      return true;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function getPosMenuLayout(outletId: string, id: string) {
  return store().posMenuLayouts.find((l) => l.outletId === outletId && l.id === id);
}

export function getActivePosMenuLayout(outletId: string): PosMenuLayout | null {
  const layouts = listPosMenuLayouts(outletId);
  return layouts.find((l) => l.active) ?? layouts[0] ?? null;
}

export function applyPosMenuLayout(
  categories: MenuCategory[],
  items: MenuItem[],
  layout: PosMenuLayout | null
): AppliedPosMenuLayout {
  const columns = layout?.columns ?? 3;
  const viewMode = layout?.viewMode ?? "scroll";
  const showPackages = layout?.showPackages ?? true;
  const hidden = new Set(layout?.hiddenCategoryIds ?? []);
  const visibleCats = categories.filter((c) => !hidden.has(c.id));
  const order = layout?.categoryOrder ?? [];

  const sortedCats = [...visibleCats].sort((a, b) => {
    const ia = order.indexOf(a.id);
    const ib = order.indexOf(b.id);
    const ra = ia === -1 ? 999 + a.sortOrder : ia;
    const rb = ib === -1 ? 999 + b.sortOrder : ib;
    return ra - rb || a.name.localeCompare(b.name, "id");
  });
  const categoriesForLayout =
    sortedCats.length > 0
      ? sortedCats
      : [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));

  const pinnedIds = layout?.pinnedItemIds ?? [];
  const pinnedSet = new Set(pinnedIds);
  const pinnedItems = pinnedIds
    .map((id) => items.find((i) => i.id === id))
    .filter((i): i is MenuItem => Boolean(i));

  const itemsByCategory: Record<string, MenuItem[]> = {};
  for (const cat of categoriesForLayout) {
    const catItems = items.filter((i) => i.categoryId === cat.id && !pinnedSet.has(i.id));
    const itemOrder = layout?.itemOrderByCategory?.[cat.id] ?? [];
    itemsByCategory[cat.id] = [...catItems].sort((a, b) => {
      const ia = itemOrder.indexOf(a.id);
      const ib = itemOrder.indexOf(b.id);
      if (ia === -1 && ib === -1) return a.name.localeCompare(b.name, "id");
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  }

  return { categories: categoriesForLayout, itemsByCategory, pinnedItems, showPackages, columns, viewMode };
}

export function upsertPosMenuLayout(input: {
  id?: string;
  outletId: string;
  name: string;
  columns?: PosMenuLayoutColumns;
  viewMode?: PosMenuLayoutViewMode;
  showPackages?: boolean;
  categoryOrder?: string[];
  hiddenCategoryIds?: string[];
  itemOrderByCategory?: Record<string, string[]>;
  pinnedItemIds?: string[];
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; layout: PosMenuLayout }
  | { ok: false; error: PosMenuLayoutSaveError } {
  const name = normalizeName(input.name);
  if (!name) return { ok: false, error: "invalid" };

  const s = store();
  const dup = s.posMenuLayouts.find(
    (x) =>
      x.outletId === input.outletId &&
      x.id !== input.id &&
      x.name.toLowerCase() === name.toLowerCase()
  );
  if (dup) return { ok: false, error: "duplicate" };

  const existing = input.id ? s.posMenuLayouts.find((x) => x.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const viewMode = input.viewMode ?? existing?.viewMode ?? "tabs";
  if (viewMode !== "tabs" && viewMode !== "scroll") return { ok: false, error: "invalid" };

  const layout: PosMenuLayout = {
    id: existing?.id ?? nextId("ml"),
    outletId: input.outletId,
    name,
    columns: clampColumns(input.columns ?? existing?.columns ?? 3),
    viewMode,
    showPackages: input.showPackages ?? existing?.showPackages ?? true,
    categoryOrder: input.categoryOrder ?? existing?.categoryOrder ?? [],
    hiddenCategoryIds: input.hiddenCategoryIds ?? existing?.hiddenCategoryIds ?? [],
    itemOrderByCategory: input.itemOrderByCategory ?? existing?.itemOrderByCategory ?? {},
    pinnedItemIds: input.pinnedItemIds ?? existing?.pinnedItemIds ?? [],
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? s.posMenuLayouts.length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) {
    Object.assign(existing, layout);
  } else {
    s.posMenuLayouts.push(layout);
  }

  persistStore();
  return { ok: true, layout };
}

export function togglePosMenuLayoutActive(outletId: string, id: string, active: boolean) {
  const layout = getPosMenuLayout(outletId, id);
  if (!layout) return { ok: false as const, error: "not-found" as const };
  layout.active = active;
  persistStore();
  return { ok: true as const };
}
