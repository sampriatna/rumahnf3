"use client";

import type { MenuItem } from "@/lib/pos-kds-roadmap";
import type { MenuRecipe } from "@/lib/pos-recipes";
import type { Item } from "@/lib/inventory";
import { saveRecipeAction } from "@/app/library/actions";

export function RecipeLibraryClient({
  outletId,
  items,
  recipe,
  ingredients,
  selectedItemId
}: {
  outletId: string;
  items: MenuItem[];
  recipe?: MenuRecipe;
  ingredients: Item[];
  selectedItemId?: string;
}) {
  const lines = recipe?.lines?.length ? recipe.lines : [{ itemId: "", qty: 0, unit: "pcs" }];

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <aside className="panel p-4 lg:col-span-1">
        <p className="mb-2 text-xs font-bold uppercase text-slate-500">Pilih Produk</p>
        <ul className="max-h-[420px] space-y-1 overflow-y-auto">
          {items.map((item) => (
            <li key={item.id}>
              <a
                href={`/library/recipes?outlet=${outletId}&item=${item.id}`}
                className={`block rounded-lg px-3 py-2 text-sm font-semibold ${
                  selectedItemId === item.id
                    ? "bg-navy-800 text-white"
                    : "text-navy-900 hover:bg-slate-50"
                }`}
              >
                {item.name}
              </a>
            </li>
          ))}
        </ul>
      </aside>

      <div className="panel p-4 lg:col-span-2">
        {!selectedItemId ? (
          <p className="text-sm text-slate-500">Pilih produk di kiri untuk edit resep/BOM.</p>
        ) : (
          <form action={saveRecipeAction} className="grid gap-4">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="menuItemId" value={selectedItemId} />
            <input
              type="hidden"
              name="recipeName"
              value={recipe?.name ?? items.find((i) => i.id === selectedItemId)?.name ?? "Resep"}
            />

            <p className="text-sm font-bold text-navy-900">
              Resep: {items.find((i) => i.id === selectedItemId)?.name}
            </p>
            <p className="text-xs text-slate-500">
              Bahan baku per 1 porsi — otomatis kurangi stok outlet saat order selesai (Fase 7d).
            </p>

            <div className="space-y-2">
              {lines.map((line, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-3">
                  <select
                    name="ingredientId"
                    defaultValue={line.itemId}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">— Bahan —</option>
                    {ingredients.map((ing) => (
                      <option key={ing.id} value={ing.id}>
                        {ing.itemName} ({ing.unit})
                      </option>
                    ))}
                  </select>
                  <input
                    name="ingredientQty"
                    type="number"
                    step="any"
                    min={0}
                    defaultValue={line.qty || ""}
                    placeholder="Qty"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <input
                    name="ingredientUnit"
                    defaultValue={line.unit}
                    placeholder="Satuan"
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-400">
              Isi beberapa baris bahan. Baris tanpa bahan diabaikan saat simpan.
            </p>

            <button type="submit" className="btn-primary w-full py-3">
              Simpan Resep
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
