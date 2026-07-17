import { store, nextId, persistStore } from "./store";

import { isPosOutlet } from "./pos-seed";

import { PACKAGE_SEED } from "./package-seed";

import { bumpMenuCatalogVersion } from "./catalog-meta";



export type MenuPackage = {

  id: string;

  outletId: string;

  name: string;

  description?: string;

  imageUrl?: string;

  bundlePrice: number;

  sortOrder: number;

  active: boolean;

};



export type MenuPackageItem = {

  id: string;

  packageId: string;

  menuItemId: string;

  qty: number;

  sortOrder: number;

};



export type PackageSaveError = "duplicate" | "invalid" | "not-found" | "empty-items";



function normalizeName(name: string) {

  return name.trim().replace(/\s+/g, " ");

}



export function ensurePackagesReady(outletId: string) {

  if (!isPosOutlet(outletId)) return;

  const has = store().menuPackages.some((p) => p.outletId === outletId);

  if (!has) bootstrapPackagesFromSeed(outletId);

}



export function bootstrapPackagesFromSeed(outletId?: string) {

  const rows = outletId ? PACKAGE_SEED.filter((r) => r.outletId === outletId) : PACKAGE_SEED;

  rows.forEach((row, i) => {

    const res = upsertMenuPackage({

      outletId: row.outletId,

      name: row.name,

      description: row.description,

      bundlePrice: row.bundlePrice,

      sortOrder: i + 1,

      active: true,

      items: row.items.map((it, j) => ({ menuItemId: it.menuItemId, qty: it.qty, sortOrder: j + 1 }))

    });

    if (!res.ok) return;

  });

  persistStore();

}



export function resetPackagesFromSeed(outletId: string) {

  const s = store();

  const pkgIds = s.menuPackages.filter((p) => p.outletId === outletId).map((p) => p.id);

  s.menuPackages = s.menuPackages.filter((p) => p.outletId !== outletId);

  s.menuPackageItems = s.menuPackageItems.filter((it) => !pkgIds.includes(it.packageId));

  bootstrapPackagesFromSeed(outletId);

}



export function listMenuPackages(outletId: string, includeInactive = false): MenuPackage[] {

  ensurePackagesReady(outletId);

  return store()

    .menuPackages.filter((p) => p.outletId === outletId && (includeInactive || p.active))

    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));

}



export function getMenuPackage(id: string) {

  return store().menuPackages.find((p) => p.id === id);

}



export function listPackageItems(packageId: string): MenuPackageItem[] {

  return store()

    .menuPackageItems.filter((it) => it.packageId === packageId)

    .sort((a, b) => a.sortOrder - b.sortOrder);

}



export function packageComponentSummary(packageId: string): string {

  const s = store();

  const lines = listPackageItems(packageId);

  return lines

    .map((it) => {

      const menu = s.menuItems.find((m) => m.id === it.menuItemId);

      const label = menu?.name ?? it.menuItemId;

      return it.qty > 1 ? `${it.qty}× ${label}` : label;

    })

    .join(" + ");

}



export function upsertMenuPackage(input: {

  id?: string;

  outletId: string;

  name: string;

  description?: string;

  imageUrl?: string;

  bundlePrice: number;

  sortOrder?: number;

  active?: boolean;

  items: Array<{ menuItemId: string; qty: number; sortOrder?: number }>;

}):

  | { ok: true; pkg: MenuPackage }

  | { ok: false; error: PackageSaveError } {

  const name = normalizeName(input.name);

  if (!name || input.bundlePrice < 0) return { ok: false, error: "invalid" };

  const validItems = input.items.filter((it) => it.menuItemId && it.qty > 0);

  if (!validItems.length) return { ok: false, error: "empty-items" };



  const s = store();

  const dup = s.menuPackages.find(

    (p) => p.outletId === input.outletId && p.id !== input.id && p.name.toLowerCase() === name.toLowerCase()

  );

  if (dup) return { ok: false, error: "duplicate" };



  const existing = input.id ? s.menuPackages.find((p) => p.id === input.id) : undefined;

  if (input.id && !existing) return { ok: false, error: "not-found" };



  const pkg: MenuPackage = {

    id: existing?.id ?? nextId("pkg"),

    outletId: input.outletId,

    name,

    description: input.description?.trim() || undefined,

    imageUrl: input.imageUrl?.trim() || undefined,

    bundlePrice: input.bundlePrice,

    sortOrder:

      input.sortOrder ??

      existing?.sortOrder ??

      s.menuPackages.filter((p) => p.outletId === input.outletId).length + 1,

    active: input.active ?? existing?.active ?? true

  };



  if (existing) Object.assign(existing, pkg);

  else s.menuPackages.push(pkg);



  s.menuPackageItems = s.menuPackageItems.filter((it) => it.packageId !== pkg.id);

  validItems.forEach((it, i) => {

    s.menuPackageItems.push({

      id: nextId("pki"),

      packageId: pkg.id,

      menuItemId: it.menuItemId,

      qty: it.qty,

      sortOrder: it.sortOrder ?? i + 1

    });

  });



  bumpMenuCatalogVersion(input.outletId);

  persistStore();

  return { ok: true, pkg };

}



export function toggleMenuPackageActive(id: string, active: boolean) {

  const pkg = getMenuPackage(id);

  if (!pkg) return { ok: false as const, error: "not-found" as const };

  pkg.active = active;

  bumpMenuCatalogVersion(pkg.outletId);

  persistStore();

  return { ok: true as const, pkg };

}

