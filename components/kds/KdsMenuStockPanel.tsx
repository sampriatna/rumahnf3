"use client";

import { useMemo, useState } from "react";
import { Ban, ChevronDown, RotateCcw, Search } from "lucide-react";
import type { MenuItem } from "@/lib/pos-kds-roadmap";
import { kdsToggleSoldOutAction } from "@/app/kds-actions";

function MenuStockBody({
  outletId,
  stationId,
  stationName,
  q,
  setQ,
  showAll,
  setShowAll,
  filtered,
  embedded
}: {
  outletId: string;
  stationId: string;
  stationName: string;
  q: string;
  setQ: (v: string) => void;
  showAll: boolean;
  setShowAll: (v: boolean) => void;
  filtered: MenuItem[];
  embedded?: boolean;
}) {
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
            aria-hidden
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari menu, mis. ayam paha..."
            className="kds-field w-full py-2 pl-9 pr-3"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-400">
          <input
            type="checkbox"
            checked={showAll}
            onChange={(e) => setShowAll(e.target.checked)}
            className="rounded"
          />
          Semua menu outlet
        </label>
      </div>

      <p className="mb-2 text-[11px] text-slate-500">
        Station <strong className="text-slate-300">{stationName}</strong> — perubahan langsung ke POS
        setelah kasir refresh halaman.
      </p>

      {filtered.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">Tidak ada menu cocok.</p>
      ) : (
        <ul className={`space-y-2 overflow-y-auto ${embedded ? "max-h-[50vh]" : "max-h-64"}`}>
          {filtered.map((item) => (
            <li
              key={item.id}
              className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 ${
                item.soldOut ? "bg-rose-950/50 ring-1 ring-rose-800" : "bg-navy-950"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{item.name}</p>
                {item.soldOut && (
                  <p className="text-[10px] font-bold uppercase text-rose-400">Habis di POS</p>
                )}
              </div>
              <form action={kdsToggleSoldOutAction}>
                <input type="hidden" name="outletId" value={outletId} />
                <input type="hidden" name="station" value={stationId} />
                <input type="hidden" name="id" value={item.id} />
                <input type="hidden" name="soldOut" value={item.soldOut ? "0" : "1"} />
                <button
                  type="submit"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${
                    item.soldOut
                      ? "bg-emerald-700 text-white hover:bg-emerald-600"
                      : "bg-rose-700 text-white hover:bg-rose-600"
                  }`}
                >
                  {item.soldOut ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                      Tersedia
                    </>
                  ) : (
                    <>
                      <Ban className="h-3.5 w-3.5" aria-hidden />
                      Habis
                    </>
                  )}
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function KdsMenuStockPanel({
  outletId,
  stationId,
  stationName,
  items,
  embedded = false
}: {
  outletId: string;
  stationId: string;
  stationName: string;
  items: MenuItem[];
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(embedded);
  const [q, setQ] = useState("");
  const [showAll, setShowAll] = useState(false);

  const stationItems = useMemo(
    () => items.filter((i) => i.defaultAreaId === stationId),
    [items, stationId]
  );
  const list = showAll ? items : stationItems.length > 0 ? stationItems : items;

  const filtered = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return list;
    return list.filter(
      (i) =>
        i.name.toLowerCase().includes(key) ||
        (i.sku?.toLowerCase().includes(key) ?? false)
    );
  }, [list, q]);

  const soldCount = list.filter((i) => i.soldOut).length;

  const body = (
    <MenuStockBody
      outletId={outletId}
      stationId={stationId}
      stationName={stationName}
      q={q}
      setQ={setQ}
      showAll={showAll}
      setShowAll={setShowAll}
      filtered={filtered}
      embedded={embedded}
    />
  );

  if (embedded) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-900 p-4">
        <div className="mb-3">
          <p className="font-bold text-white">Menu Habis → Sync POS</p>
          <p className="text-xs text-slate-400">
            {soldCount > 0
              ? `${soldCount} menu ditandai habis — kasir tidak bisa pesan`
              : "Tandai bahan/menu habis langsung dari dapur"}
          </p>
        </div>
        {body}
      </div>
    );
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-navy-700 bg-navy-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-navy-800"
      >
        <Ban className="h-5 w-5 shrink-0 text-rose-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">Menu Habis → Sync POS</p>
          <p className="text-xs text-slate-400">
            {soldCount > 0
              ? `${soldCount} menu ditandai habis — kasir tidak bisa pesan`
              : "Tandai bahan/menu habis (mis. ayam paha) langsung dari dapur"}
          </p>
        </div>
        {soldCount > 0 && (
          <span className="rounded-full bg-rose-600 px-2.5 py-0.5 text-xs font-bold text-white">
            {soldCount}
          </span>
        )}
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && <div className="border-t border-navy-700 px-4 py-3">{body}</div>}
    </div>
  );
}
