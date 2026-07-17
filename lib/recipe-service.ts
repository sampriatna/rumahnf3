import type { MenuRecipe, MenuRecipeLine } from "./pos-recipes";
import { store, persistStore } from "./store";
import { getMenuForOutlet } from "./pos-service";
import { bumpMenuCatalogVersion } from "./catalog-meta";
import { recordAuditEvent } from "./audit-log";

function ensureLoaded(outletId: string) {
  getMenuForOutlet(outletId);
}

export function persistRecipeCatalog(outletId?: string) {
  if (outletId) bumpMenuCatalogVersion(outletId);
  persistStore();
}

export function getRecipeForItem(menuItemId: string): MenuRecipe | undefined {
  return store().posRecipes.find((r) => r.menuItemId === menuItemId);
}

export function listRecipesForOutlet(outletId: string): MenuRecipe[] {
  ensureLoaded(outletId);
  const itemIds = new Set(
    store().menuItems.filter((i) => i.outletId === outletId).map((i) => i.id)
  );
  return store().posRecipes.filter((r) => itemIds.has(r.menuItemId));
}

export function upsertRecipe(input: {
  menuItemId: string;
  name: string;
  lines: MenuRecipeLine[];
  actorId?: string;
  actorName?: string;
}): MenuRecipe {
  const s = store();
  const existing = s.posRecipes.find((r) => r.menuItemId === input.menuItemId);
  const recipe: MenuRecipe = {
    menuItemId: input.menuItemId,
    name: input.name.trim(),
    lines: input.lines.filter((l) => l.itemId && l.qty > 0)
  };
  if (existing) {
    const idx = s.posRecipes.findIndex((r) => r.menuItemId === input.menuItemId);
    s.posRecipes[idx] = recipe;
  } else {
    s.posRecipes.push(recipe);
  }
  const item = s.menuItems.find((i) => i.id === input.menuItemId);
  persistRecipeCatalog(item?.outletId);
  recordAuditEvent({
    action: "inventory.recipe_upsert",
    actorId: input.actorId,
    actorName: input.actorName ?? "system",
    outletId: item?.outletId,
    entityType: "menu_recipe",
    entityId: input.menuItemId,
    meta: { lineCount: recipe.lines.length, name: recipe.name }
  });
  return recipe;
}

export function deleteRecipe(
  menuItemId: string,
  actor?: { id?: string; name?: string }
) {
  const s = store();
  const item = s.menuItems.find((i) => i.id === menuItemId);
  s.posRecipes = s.posRecipes.filter((r) => r.menuItemId !== menuItemId);
  persistRecipeCatalog(item?.outletId);
  recordAuditEvent({
    action: "inventory.recipe_delete",
    actorId: actor?.id,
    actorName: actor?.name ?? "system",
    outletId: item?.outletId,
    entityType: "menu_recipe",
    entityId: menuItemId
  });
}
