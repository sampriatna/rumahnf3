import type { MenuModifier } from "./pos-kds-roadmap";
import { store } from "./store";

/** Modifier demo — KBU. */
export function seedMenuModifiers(): MenuModifier[] {
  return [
    { id: "mod-hot", outletId: "kbu", name: "Hot", priceDelta: 0, active: true },
    { id: "mod-ice", outletId: "kbu", name: "Ice", priceDelta: 0, active: true },
    { id: "mod-less-sugar", outletId: "kbu", name: "Kurang Manis", priceDelta: 0, active: true },
    { id: "mod-extra-shot", outletId: "kbu", name: "Extra Shot", priceDelta: 5_000, active: true },
    { id: "mod-oat", outletId: "kbu", name: "Oat Milk", priceDelta: 7_000, active: true },
    { id: "mod-level-1", outletId: "kbu", name: "Pedas 1", priceDelta: 0, active: true },
    { id: "mod-level-2", outletId: "kbu", name: "Pedas 2", priceDelta: 0, active: true },
    { id: "mod-extra-nasi", outletId: "kbu", name: "Extra Nasi", priceDelta: 5_000, active: true }
  ];
}

/** Modifier yang relevan per menu item (seed demo). */
export const SEED_ITEM_MODIFIER_MAP: Record<string, string[]> = {
  "mi-latte": ["mod-hot", "mod-ice", "mod-less-sugar", "mod-extra-shot", "mod-oat"],
  "mi-cappuccino": ["mod-hot", "mod-ice", "mod-less-sugar", "mod-extra-shot", "mod-oat"],
  "mi-espresso": ["mod-hot", "mod-extra-shot"],
  "mi-matcha": ["mod-ice", "mod-less-sugar", "mod-oat"],
  "mi-nasi-goreng": ["mod-level-1", "mod-level-2", "mod-extra-nasi"],
  "mi-mie-goreng": ["mod-level-1", "mod-level-2"]
};

function modifierIdsForItem(menuItemId: string): string[] {
  const fromStore = store().menuItemModifierLinks?.[menuItemId];
  if (fromStore?.length) return fromStore;
  return SEED_ITEM_MODIFIER_MAP[menuItemId] ?? [];
}

export function modifiersForMenuItem(
  menuItemId: string,
  all: MenuModifier[]
): MenuModifier[] {
  const ids = modifierIdsForItem(menuItemId);
  return ids
    .map((id) => all.find((m) => m.id === id && m.active))
    .filter(Boolean) as MenuModifier[];
}

export function itemHasModifiers(menuItemId: string): boolean {
  return modifierIdsForItem(menuItemId).length > 0;
}

export function modifierKey(modifiers: Array<{ name: string; priceDelta: number }>) {
  return modifiers
    .map((m) => m.name)
    .sort()
    .join("|");
}
