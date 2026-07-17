"use client";

import { RefreshCw } from "lucide-react";
import { syncPosMenuAction } from "@/app/library/actions";
import type { MenuCatalogMeta } from "@/lib/pos-kds-roadmap";

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return iso;
  }
}

export function LibraryCatalogBanner({
  outletId,
  meta
}: {
  outletId: string;
  meta: MenuCatalogMeta | null;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1 text-sm">
        <p className="font-bold text-navy-900">Sinkronisasi POS</p>
        <p className="text-xs text-slate-500">
          {meta
            ? `Menu v${meta.version} · terakhir diubah ${formatTime(meta.updatedAt)}`
            : "Belum ada perubahan tercatat — simpan produk untuk mulai tracking."}
        </p>
      </div>
      <form action={syncPosMenuAction}>
        <input type="hidden" name="outletId" value={outletId} />
        <button type="submit" className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <RefreshCw className="h-4 w-4" aria-hidden />
          Sinkronkan POS
        </button>
      </form>
      <p className="w-full text-[11px] text-slate-400">
        Kasir: refresh halaman POS setelah edit menu (mirip sync tablet Moka).
      </p>
    </div>
  );
}
