import type { MenuModifier } from "./pos-kds-roadmap";
import { store, nextId, persistStore } from "./store";
import { getMenuForOutlet } from "./pos-service";
import { seedMenuModifiers, SEED_ITEM_MODIFIER_MAP } from "./pos-modifiers";
import { bumpMenuCatalogVersion } from "./catalog-meta";

function ensureModifiersLoaded(outletId: string) {
  getMenuForOutlet(outletId);
  const s = store();
  if (!s.menuModifiers?.length) {
    s.menuModifiers = seedMenuModifiers();
  }
  if (!s.menuItemModifierLinks || Object.keys(s.menuItemModifierLinks).length === 0) {
    s.menuItemModifierLinks = { ...SEED_ITEM_MODIFIER_MAP };
  }
}

export function persistModifierCatalog(outletId?: string) {
  if (outletId) bumpMenuCatalogVersion(outletId);
  persistStore();
}

export function listModifiers(outletId: string, includeInactive = false): MenuModifier[] {
  ensureModifiersLoaded(outletId);
  return store()
    .menuModifiers.filter((m) => m.outletId === outletId && (includeInactive || m.active))
    .sort((a, b) => a.name.localeCompare(b.name, "id"));
}

export function getModifierIdsForItem(menuItemId: string): string[] {
  const s = store();
  return s.menuItemModifierLinks?.[menuItemId] ?? SEED_ITEM_MODIFIER_MAP[menuItemId] ?? [];
}

export function setModifierIdsForItem(menuItemId: string, modifierIds: string[]) {
  const s = store();
  if (!s.menuItemModifierLinks) s.menuItemModifierLinks = {};
  s.menuItemModifierLinks[menuItemId] = [...new Set(modifierIds)];
  const item = s.menuItems.find((i) => i.id === menuItemId);
  persistModifierCatalog(item?.outletId);
}

export function upsertModifier(input: {
  id?: string;
  outletId: string;
  name: string;
  priceDelta: number;
  active?: boolean;
}): MenuModifier {
  ensureModifiersLoaded(input.outletId);
  const s = store();
  const existing = input.id ? s.menuModifiers.find((m) => m.id === input.id) : undefined;
  const mod: MenuModifier = {
    id: existing?.id ?? nextId("mod"),
    outletId: input.outletId,
    name: input.name.trim(),
    priceDelta: Math.max(0, Math.round(input.priceDelta)),
    active: input.active ?? true
  };
  if (existing) {
    const idx = s.menuModifiers.findIndex((m) => m.id === existing.id);
    s.menuModifiers[idx] = mod;
  } else {
    s.menuModifiers.push(mod);
  }
  persistModifierCatalog(input.outletId);
  return mod;
}

export function toggleModifierActive(id: string, active: boolean): MenuModifier | null {
  const mod = store().menuModifiers.find((m) => m.id === id);
  if (!mod) return null;
  mod.active = active;
  persistModifierCatalog(mod.outletId);
  return mod;
}
