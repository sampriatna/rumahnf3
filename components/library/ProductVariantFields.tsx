"use client";

import { Plus } from "lucide-react";
import type { MenuItemVariant } from "@/lib/pos-kds-roadmap";

type Row = { name: string; price: number; costPrice?: number; sku?: string };

export function ProductVariantFields({ initial }: { initial: MenuItemVariant[] }) {
  const rows: Row[] =
    initial.length > 0
      ? initial.map((v) => ({
          name: v.name,
          price: v.price,
          costPrice: v.costPrice,
          sku: v.sku
        }))
      : [{ name: "", price: 0 }];

  return (
    <fieldset className="rounded-xl border border-slate-200 p-4">
      <legend className="px-1 text-xs font-bold uppercase text-slate-500">
        Varian (ukuran/rasa — harga beda)
      </legend>
      <p className="mb-3 text-[11px] text-slate-400">
        Kosongkan semua baris bila produk hanya punya satu harga. Mirip varian S/M/L di Moka.
      </p>
      <div className="grid gap-2" id="variant-rows">
        {rows.map((row, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-4">
            <input
              name="variantName"
              defaultValue={row.name}
              placeholder="Nama varian (Hot, Large...)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              name="variantPrice"
              type="number"
              min={0}
              defaultValue={row.price || ""}
              placeholder="Harga jual"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              name="variantCostPrice"
              type="number"
              min={0}
              defaultValue={row.costPrice ?? ""}
              placeholder="Modal (opsional)"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
            <input
              name="variantSku"
              defaultValue={row.sku ?? ""}
              placeholder="SKU varian"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
        <Plus className="h-3 w-3" aria-hidden />
        Tambah baris varian dengan isi form lalu simpan — kosongkan nama untuk hapus baris.
      </p>
    </fieldset>
  );
}
