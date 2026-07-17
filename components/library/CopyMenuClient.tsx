"use client";

import { Copy } from "lucide-react";
import { copyMenuAction } from "@/app/library/actions";

export function CopyMenuClient({
  outlets,
  sourceOutletId,
  targetOutletId
}: {
  outlets: Array<{ id: string; name: string }>;
  sourceOutletId: string;
  targetOutletId: string;
}) {
  return (
    <form action={copyMenuAction} className="panel max-w-lg grid gap-4 p-6">
      <p className="text-sm text-slate-600">
        Salin kategori, produk, add-on, varian, dan resep dari satu outlet ke outlet lain — mirip duplikat
        menu di Moka.
      </p>
      <div>
        <label className="text-xs font-bold text-slate-500">Dari outlet</label>
        <select
          name="sourceOutletId"
          defaultValue={sourceOutletId}
          className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
        >
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs font-bold text-slate-500">Ke outlet</label>
        <select
          name="targetOutletId"
          defaultValue={targetOutletId}
          className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
        >
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn-primary flex items-center justify-center gap-2 py-3">
        <Copy className="h-4 w-4" aria-hidden />
        Salin Menu
      </button>
      <p className="text-[11px] text-slate-400">
        Produk dengan nama sama di outlet tujuan dilewati (tidak ditimpa).
      </p>
    </form>
  );
}
