import { store, nextId, persistStore } from "./store";
import { getMenuForOutlet } from "./pos-service";
import { setModifierIdsForItem } from "./modifier-service";
import { bumpMenuCatalogVersion } from "./catalog-meta";
import type { MenuCategory, MenuItem, MenuModifier } from "./pos-kds-roadmap";
import type { MenuRecipe } from "./pos-recipes";

export type MenuCopyResult = {
  categories: number;
  items: number;
  modifiers: number;
  recipes: number;
  variants: number;
  skipped: number;
};

function norm(s: string) {
  return s.trim().toLowerCase();
}

/** Salin katalog menu dari outlet sumber ke target (mirip duplikat menu Moka). */
export function copyOutletMenu(sourceOutletId: string, targetOutletId: string): MenuCopyResult {
  getMenuForOutlet(sourceOutletId);
  getMenuForOutlet(targetOutletId);
  const s = store();

  const catMap = new Map<string, string>();
  const itemMap = new Map<string, string>();
  const modMap = new Map<string, string>();

  let categories = 0;
  let items = 0;
  let modifiers = 0;
  let recipes = 0;
  let variants = 0;
  let skipped = 0;

  const targetCatNames = new Set(
    s.menuCategories.filter((c) => c.outletId === targetOutletId).map((c) => norm(c.name))
  );
  const targetItemNames = new Set(
    s.menuItems.filter((i) => i.outletId === targetOutletId).map((i) => norm(i.name))
  );
  const targetModNames = new Set(
    s.menuModifiers.filter((m) => m.outletId === targetOutletId).map((m) => norm(m.name))
  );

  for (const src of s.menuCategories.filter((c) => c.outletId === sourceOutletId && c.active)) {
    if (targetCatNames.has(norm(src.name))) {
      const existing = s.menuCategories.find(
        (c) => c.outletId === targetOutletId && norm(c.name) === norm(src.name)
      );
      if (existing) catMap.set(src.id, existing.id);
      skipped++;
      continue;
    }
    const cat: MenuCategory = {
      id: nextId("cat"),
      outletId: targetOutletId,
      name: src.name,
      sortOrder: src.sortOrder,
      active: true
    };
    s.menuCategories.push(cat);
    catMap.set(src.id, cat.id);
    categories++;
  }

  for (const src of s.menuModifiers.filter((m) => m.outletId === sourceOutletId && m.active)) {
    if (targetModNames.has(norm(src.name))) {
      const existing = s.menuModifiers.find(
        (m) => m.outletId === targetOutletId && norm(m.name) === norm(src.name)
      );
      if (existing) modMap.set(src.id, existing.id);
      skipped++;
      continue;
    }
    const mod: MenuModifier = {
      id: nextId("mod"),
      outletId: targetOutletId,
      name: src.name,
      priceDelta: src.priceDelta,
      active: true
    };
    s.menuModifiers.push(mod);
    modMap.set(src.id, mod.id);
    modifiers++;
  }

  for (const src of s.menuItems.filter((i) => i.outletId === sourceOutletId && i.active)) {
    if (targetItemNames.has(norm(src.name))) {
      skipped++;
      continue;
    }
    const item: MenuItem = {
      id: nextId("mi"),
      outletId: targetOutletId,
      categoryId: src.categoryId ? catMap.get(src.categoryId) : undefined,
      sku: src.sku,
      name: src.name,
      description: src.description,
      imageUrl: src.imageUrl,
      basePrice: src.basePrice,
      costPrice: src.costPrice,
      soldOut: false,
      taxIncluded: src.taxIncluded,
      defaultAreaId: src.defaultAreaId,
      prepTimeMinutes: src.prepTimeMinutes,
      active: true
    };
    s.menuItems.push(item);
    itemMap.set(src.id, item.id);
    items++;

    const modIds = (s.menuItemModifierLinks?.[src.id] ?? [])
      .map((mid) => modMap.get(mid))
      .filter(Boolean) as string[];
    if (modIds.length) setModifierIdsForItem(item.id, modIds);

    for (const v of s.menuItemVariants.filter((vr) => vr.menuItemId === src.id && vr.active)) {
      s.menuItemVariants.push({
        id: nextId("var"),
        menuItemId: item.id,
        outletId: targetOutletId,
        name: v.name,
        sku: v.sku,
        price: v.price,
        costPrice: v.costPrice,
        sortOrder: v.sortOrder,
        active: true
      });
      variants++;
    }

    const recipe = s.posRecipes.find((r) => r.menuItemId === src.id);
    if (recipe) {
      const copy: MenuRecipe = {
        menuItemId: item.id,
        name: recipe.name,
        lines: recipe.lines.map((l) => ({ ...l }))
      };
      s.posRecipes.push(copy);
      recipes++;
    }
  }

  bumpMenuCatalogVersion(targetOutletId);
  persistStore();
  return { categories, items, modifiers, recipes, variants, skipped };
}
