import type { MenuCatalogMeta } from "./pos-kds-roadmap";
import { store } from "./store";

/** Naikkan versi katalog outlet — dipanggil setiap edit menu (Library → POS sync). */
export function bumpMenuCatalogVersion(outletId: string): MenuCatalogMeta {
  const s = store();
  if (!s.menuCatalogMeta) s.menuCatalogMeta = {};
  const prev = s.menuCatalogMeta[outletId];
  const meta: MenuCatalogMeta = {
    outletId,
    version: (prev?.version ?? 0) + 1,
    updatedAt: new Date().toISOString()
  };
  s.menuCatalogMeta[outletId] = meta;
  return meta;
}

export function getMenuCatalogMeta(outletId: string): MenuCatalogMeta | null {
  return store().menuCatalogMeta?.[outletId] ?? null;
}
