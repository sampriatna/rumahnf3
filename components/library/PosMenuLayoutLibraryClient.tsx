"use client";

import { useMemo } from "react";
import { LayoutGrid, Star } from "lucide-react";
import type { MenuCategory, MenuItem } from "@/lib/pos-kds-roadmap";
import type { PosMenuLayout } from "@/lib/pos-menu-layout-service";
import {
  savePosMenuLayoutAction,
  moveCategoryOrderAction,
  bootstrapPosMenuLayoutsAction
} from "@/app/library/pos-menu-layout-actions";

export function PosMenuLayoutLibraryClient({
  outletId,
  layout,
  categories,
  items,
  previewCategoryOrder
}: {
  outletId: string;
  layout: PosMenuLayout;
  categories: MenuCategory[];
  items: MenuItem[];
  previewCategoryOrder: string[];
}) {
  const orderedCategories = useMemo(() => {
    const byId = Object.fromEntries(categories.map((c) => [c.id, c]));
    const seen = new Set<string>();
    const result: MenuCategory[] = [];
    for (const id of previewCategoryOrder) {
      const cat = byId[id];
      if (cat) {
        result.push(cat);
        seen.add(id);
      }
    }
    for (const cat of categories) {
      if (!seen.has(cat.id)) result.push(cat);
    }
    return result;
  }, [categories, previewCategoryOrder]);

  const hiddenSet = new Set(layout.hiddenCategoryIds);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Layout aktif: <strong>{layout.name}</strong> · {layout.viewMode === "tabs" ? "Tab kategori" : "Scroll semua"} ·{" "}
          {layout.columns} kolom
        </p>
        <form action={bootstrapPosMenuLayoutsAction}>
          <input type="hidden" name="outletId" value={outletId} />
          <button type="submit" className="btn-secondary px-3 py-2 text-xs">
            Reset template
          </button>
        </form>
      </div>

      <form action={savePosMenuLayoutAction} className="panel mb-6 grid gap-4 p-4">
        <input type="hidden" name="outletId" value={outletId} />
        <input type="hidden" name="id" value={layout.id} />
        <input type="hidden" name="categoryOrder" value={layout.categoryOrder.join(",")} />

        <h2 className="flex items-center gap-2 font-black text-navy-900">
          <LayoutGrid className="h-5 w-5 text-gold-600" aria-hidden />
          Pengaturan tampilan
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-bold text-slate-700">
            Nama layout
            <input
              name="name"
              required
              defaultValue={layout.name}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Kolom grid POS
            <select
              name="columns"
              defaultValue={String(layout.columns)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal"
            >
              <option value="2">2 kolom</option>
              <option value="3">3 kolom</option>
              <option value="4">4 kolom</option>
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Mode tampilan
            <select
              name="viewMode"
              defaultValue={layout.viewMode}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-normal"
            >
              <option value="tabs">Tab kategori (satu kategori per layar)</option>
              <option value="scroll">Scroll (semua kategori)</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm font-bold text-slate-700">
            <input type="hidden" name="showPackages" value="0" />
            <input
              type="checkbox"
              name="showPackages"
              value="1"
              defaultChecked={layout.showPackages}
              className="rounded"
            />
            Tampilkan section Paket Menu di POS
          </label>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
            <Star className="h-4 w-4 text-gold-600" aria-hidden />
            Menu favorit (pin di atas grid POS)
          </p>
          <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 p-3">
            <ul className="grid gap-2 sm:grid-cols-2">
              {items.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="pinnedItemIds"
                      value={item.id}
                      defaultChecked={layout.pinnedItemIds.includes(item.id)}
                      className="rounded"
                    />
                    <span className="truncate">{item.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full py-3 sm:w-auto sm:px-8">
          Simpan layout
        </button>
      </form>

      <div className="panel p-4">
        <h2 className="mb-3 font-black text-navy-900">Urutan & visibilitas kategori</h2>
        <p className="mb-4 text-xs text-slate-500">
          Kategori tersembunyi tidak muncul di POS. Urutan di bawah mengontrol tab/section.
        </p>
        <ul className="divide-y divide-slate-100">
          {orderedCategories.map((cat) => (
            <li key={cat.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <div>
                <p className={`font-bold ${hiddenSet.has(cat.id) ? "text-slate-400 line-through" : "text-navy-900"}`}>
                  {cat.name}
                </p>
                <p className="text-xs text-slate-400">
                  {items.filter((i) => i.categoryId === cat.id).length} item
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <form action={moveCategoryOrderAction} className="inline">
                  <input type="hidden" name="outletId" value={outletId} />
                  <input type="hidden" name="layoutId" value={layout.id} />
                  <input type="hidden" name="categoryId" value={cat.id} />
                  <input type="hidden" name="direction" value="up" />
                  <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                    ↑
                  </button>
                </form>
                <form action={moveCategoryOrderAction} className="inline">
                  <input type="hidden" name="outletId" value={outletId} />
                  <input type="hidden" name="layoutId" value={layout.id} />
                  <input type="hidden" name="categoryId" value={cat.id} />
                  <input type="hidden" name="direction" value="down" />
                  <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                    ↓
                  </button>
                </form>
                <form action={savePosMenuLayoutAction} className="inline">
                  <input type="hidden" name="outletId" value={outletId} />
                  <input type="hidden" name="id" value={layout.id} />
                  <input type="hidden" name="name" value={layout.name} />
                  <input type="hidden" name="columns" value={String(layout.columns)} />
                  <input type="hidden" name="viewMode" value={layout.viewMode} />
                  <input type="hidden" name="showPackages" value={layout.showPackages ? "1" : "0"} />
                  <input type="hidden" name="categoryOrder" value={layout.categoryOrder.join(",")} />
                  {layout.pinnedItemIds.map((id) => (
                    <input key={id} type="hidden" name="pinnedItemIds" value={id} />
                  ))}
                  {orderedCategories
                    .filter((c) => c.id !== cat.id && hiddenSet.has(c.id))
                    .map((c) => (
                      <input key={c.id} type="hidden" name="hiddenCategoryIds" value={c.id} />
                    ))}
                  {!hiddenSet.has(cat.id) && (
                    <input type="hidden" name="hiddenCategoryIds" value={cat.id} />
                  )}
                  <button type="submit" className="btn-secondary px-2 py-1 text-xs">
                    {hiddenSet.has(cat.id) ? "Tampilkan" : "Sembunyikan"}
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
