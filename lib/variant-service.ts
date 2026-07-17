import type { MenuItemVariant } from "./pos-kds-roadmap";
import { store, nextId, persistStore } from "./store";
import { getMenuForOutlet } from "./pos-service";
import { bumpMenuCatalogVersion } from "./catalog-meta";

function ensureLoaded(outletId: string) {
  getMenuForOutlet(outletId);
}

export function persistVariantCatalog(outletId?: string) {
  if (outletId) bumpMenuCatalogVersion(outletId);
  persistStore();
}

export function listVariantsForItem(menuItemId: string, includeInactive = false): MenuItemVariant[] {
  return store()
    .menuItemVariants.filter(
      (v) => v.menuItemId === menuItemId && (includeInactive || v.active)
    )
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function listVariantsForOutlet(outletId: string, includeInactive = false): MenuItemVariant[] {
  ensureLoaded(outletId);
  return store()
    .menuItemVariants.filter(
      (v) => v.outletId === outletId && (includeInactive || v.active)
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getVariant(id: string): MenuItemVariant | undefined {
  return store().menuItemVariants.find((v) => v.id === id);
}

export function upsertVariant(input: {
  id?: string;
  menuItemId: string;
  outletId: string;
  name: string;
  sku?: string;
  price: number;
  costPrice?: number;
  sortOrder?: number;
  active?: boolean;
}): MenuItemVariant {
  ensureLoaded(input.outletId);
  const s = store();
  const existing = input.id ? s.menuItemVariants.find((v) => v.id === input.id) : undefined;
  const maxSort = s.menuItemVariants
    .filter((v) => v.menuItemId === input.menuItemId)
    .reduce((m, v) => Math.max(m, v.sortOrder), 0);

  const variant: MenuItemVariant = {
    id: existing?.id ?? nextId("var"),
    menuItemId: input.menuItemId,
    outletId: input.outletId,
    name: input.name.trim(),
    sku: input.sku?.trim() || undefined,
    price: Math.max(0, Math.round(input.price)),
    costPrice:
      input.costPrice != null && !Number.isNaN(input.costPrice)
        ? Math.max(0, Math.round(input.costPrice))
        : undefined,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? maxSort + 1,
    active: input.active ?? true
  };

  if (existing) {
    const idx = s.menuItemVariants.findIndex((v) => v.id === existing.id);
    s.menuItemVariants[idx] = variant;
  } else {
    s.menuItemVariants.push(variant);
  }
  persistVariantCatalog(input.outletId);
  return variant;
}

/** Ganti seluruh varian produk sekaligus (dari form Library). */
export function replaceVariantsForItem(
  menuItemId: string,
  outletId: string,
  rows: Array<{ name: string; sku?: string; price: number; costPrice?: number }>
) {
  ensureLoaded(outletId);
  const s = store();
  s.menuItemVariants = s.menuItemVariants.filter((v) => v.menuItemId !== menuItemId);
  rows.forEach((row, i) => {
    if (!row.name.trim()) return;
    s.menuItemVariants.push({
      id: nextId("var"),
      menuItemId,
      outletId,
      name: row.name.trim(),
      sku: row.sku?.trim() || undefined,
      price: Math.max(0, Math.round(row.price)),
      costPrice:
        row.costPrice != null && !Number.isNaN(row.costPrice)
          ? Math.max(0, Math.round(row.costPrice))
          : undefined,
      sortOrder: i + 1,
      active: true
    });
  });
  persistVariantCatalog(outletId);
}

export function itemHasVariants(menuItemId: string): boolean {
  return listVariantsForItem(menuItemId).length > 0;
}
