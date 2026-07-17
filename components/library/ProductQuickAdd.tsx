"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import type { MenuCategory } from "@/lib/pos-kds-roadmap";
import { PRODUCT_EMOJI_OPTIONS } from "@/lib/menu-images";
import { quickAddMenuItemAction } from "@/app/library/actions";

export function ProductQuickAdd({
  outletId,
  categories
}: {
  outletId: string;
  categories: MenuCategory[];
}) {
  const [emoji, setEmoji] = useState("☕");
  const defaultCat = categories.find((c) => c.active)?.id ?? categories[0]?.id ?? "";

  return (
    <section className="panel mb-6 border-gold-200 bg-gold-50/30 p-4">
      <div className="mb-3 flex items-center gap-2">
        <Zap className="h-4 w-4 text-gold-600" aria-hidden />
        <h2 className="text-sm font-black text-navy-900">Tambah Cepat</h2>
        <span className="text-xs text-slate-500">— isi 3 kolom, langsung masuk POS</span>
      </div>

      <form action={quickAddMenuItemAction} className="grid gap-3 sm:grid-cols-12 sm:items-end">
        <input type="hidden" name="outletId" value={outletId} />
        <input type="hidden" name="imageUrl" value={`emoji:${emoji}`} />

        <div className="sm:col-span-4">
          <label className="text-xs font-bold text-slate-500">Nama Produk *</label>
          <input
            name="name"
            required
            placeholder="Contoh: Es Teh Manis"
            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-500">Harga (Rp) *</label>
          <input
            name="basePrice"
            type="number"
            required
            min={0}
            step={500}
            placeholder="15000"
            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
          />
        </div>

        <div className="sm:col-span-3">
          <label className="text-xs font-bold text-slate-500">Kategori *</label>
          <select
            name="categoryId"
            required
            defaultValue={defaultCat}
            className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold"
          >
            {categories.length === 0 ? (
              <option value="">Buat kategori dulu</option>
            ) : (
              categories
                .filter((c) => c.active)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
            )}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-500">Ikon</label>
          <div className="mt-1 flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-2">
            {PRODUCT_EMOJI_OPTIONS.slice(0, 6).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-lg ${
                  emoji === e ? "bg-navy-800 text-white" : "hover:bg-slate-100"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-1">
          <button
            type="submit"
            disabled={categories.length === 0}
            className="btn-primary w-full py-3 text-sm disabled:opacity-50"
          >
            + Add
          </button>
        </div>
      </form>
    </section>
  );
}
