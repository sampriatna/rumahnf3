import type { PosOrder } from "./pos-kds-roadmap";
import type { MasterBahan } from "@/types/inventory";
import { getItem } from "./inventory-service";
import { insertPemakaianOutlet, pullMasterBahan, pullPemakaianOutlet } from "./db/inventory-sheets-repo";
import { isSupabaseConfigured } from "./supabase";
import { toOutletCode } from "./outlet-identity";
import { getRecipeForMenuItem } from "./pos-recipes";
import { store } from "./store";
import { todayIso } from "./date-format";

function outletToLokasi(outletId: string): string {
  return toOutletCode(outletId);
}

function resolveKodeBahan(itemId: string, bahanList: MasterBahan[]): string | null {
  const item = getItem(itemId);
  if (!item) return null;
  const name = item.itemName.toLowerCase();

  const exact = bahanList.find((b) => b.namaBaku.toLowerCase() === name);
  if (exact) return exact.kodeBahan;

  const partial = bahanList.find(
    (b) => name.includes(b.namaBaku.toLowerCase()) || b.namaBaku.toLowerCase().includes(name)
  );
  return partial?.kodeBahan ?? null;
}

import { isSupabaseInventoryEnabled } from "./inventory-sheets-enabled";

/** Catat pemakaian outlet dari BOM POS ke tabel Supabase (idempotent per order). */
export async function recordPosBomToSupabase(order: PosOrder, createdBy: string): Promise<number> {
  if (!isSupabaseConfigured() || !isSupabaseInventoryEnabled()) return 0;

  const marker = `POS:${order.id}`;
  const existing = await pullPemakaianOutlet();
  if (existing.some((row) => row.jenisPemakaian === marker)) {
    return 0;
  }

  const bahanList = await pullMasterBahan();
  if (!bahanList.length) return 0;

  const recipes = store().posRecipes;
  const lokasi = outletToLokasi(order.outletId);
  const tanggal = todayIso();
  let written = 0;

  for (const line of order.items) {
    if (!line.menuItemId) continue;
    const recipe = getRecipeForMenuItem(line.menuItemId, recipes);
    if (!recipe) continue;

    for (const rl of recipe.lines) {
      const kodeBahan = resolveKodeBahan(rl.itemId, bahanList);
      if (!kodeBahan) continue;

      await insertPemakaianOutlet({
        id: `${order.id}-${kodeBahan}-${written}`,
        tanggal,
        kodeBahan,
        qty: rl.qty * line.qty,
        lokasi,
        jenisPemakaian: marker,
        pic: createdBy
      });
      written += 1;
    }
  }

  return written;
}
