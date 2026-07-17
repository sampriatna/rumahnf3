"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { MasterLokasi } from "@/types/inventory";
import type { StockOverviewRow } from "@/lib/inventory-overview";
import type { StatusStok } from "@/types/inventory";
import { InventoryStatusBadge, inventoryStatusFilterClass } from "./InventoryStatusBadge";

type Filter = "ALL" | StatusStok;

function formatQty(n: number) {
  return n.toLocaleString("id-ID");
}

function lokasiHeaderClass(kode: string) {
  if (kode === "GDG") return "bg-navy-50/80";
  return "bg-[#FBF8F0]";
}

function qtyCellClass(qty: number, isWarehouse: boolean) {
  if (qty < 0) return "bg-rose-50 font-bold text-rose-700";
  if (qty === 0) return isWarehouse ? "text-slate-300" : "bg-amber-50/60 text-amber-800";
  return "text-slate-800";
}

export function InventorySaldoTable({
  rows,
  lokasiColumns
}: {
  rows: StockOverviewRow[];
  lokasiColumns: MasterLokasi[];
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const counts = useMemo(
    () => ({
      ALL: rows.length,
      BELI: rows.filter((r) => r.status === "BELI").length,
      WASPADA: rows.filter((r) => r.status === "WASPADA").length,
      AMAN: rows.filter((r) => r.status === "AMAN").length
    }),
    [rows]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "ALL" && row.status !== filter) return false;
      if (!q) return true;
      return (
        row.namaBaku.toLowerCase().includes(q) ||
        row.kodeBahan.toLowerCase().includes(q) ||
        row.kategori.toLowerCase().includes(q)
      );
    });
  }, [rows, search, filter]);

  const filters: { key: Filter; label: string }[] = [
    { key: "ALL", label: "Semua" },
    { key: "BELI", label: "Beli" },
    { key: "WASPADA", label: "Waspada" },
    { key: "AMAN", label: "Aman" }
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-[#FBF8F0]/50 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" aria-hidden />
            <h2 className="text-sm font-bold text-navy-900">Daftar bahan</h2>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-500 shadow-sm">
              {filtered.length}/{rows.length}
            </span>
          </div>
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / kode…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${inventoryStatusFilterClass(f.key, filter === f.key)}`}
            >
              {f.label}
              <span className="ml-1 opacity-70">({counts[f.key]})</span>
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500">
          <span className="font-bold uppercase tracking-wide text-slate-400">Keterangan kolom</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-6 rounded border border-navy-100 bg-navy-50/80" aria-hidden />
            Gudang (GDG)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-6 rounded border border-slate-200 bg-[#FBF8F0]" aria-hidden />
            Outlet
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-6 rounded border border-amber-200 bg-amber-50/60" aria-hidden />
            Stok 0 di outlet
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-6 rounded border border-rose-200 bg-rose-50" aria-hidden />
            Stok negatif
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="sticky top-0 z-30 shadow-[0_1px_0_0_rgba(226,232,240,1)]">
            <tr className="border-b border-slate-100 bg-slate-50/95 text-[10px] uppercase tracking-wider text-slate-500 backdrop-blur-sm">
              <th className="sticky left-0 z-20 min-w-[200px] bg-slate-50/95 px-4 py-3 backdrop-blur-sm">
                Bahan
              </th>
              {lokasiColumns.map((loc) => (
                <th
                  key={loc.kode}
                  className={`px-3 py-3 text-center ${lokasiHeaderClass(loc.kode)}`}
                >
                  <div className="font-mono text-xs font-extrabold text-navy-800">{loc.kode}</div>
                  <div className="mt-0.5 max-w-[72px] truncate font-normal normal-case text-[9px] text-slate-400">
                    {loc.namaLokasi}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center">Total</th>
              <th className="px-3 py-3 text-center">Min</th>
              <th className="px-3 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={lokasiColumns.length + 4}
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  Tidak ada bahan yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => (
                <tr
                  key={row.kodeBahan}
                  className={`border-b border-slate-50 transition hover:bg-slate-50/60 ${
                    row.isCritical ? "border-l-[3px] border-l-[#883224]" : ""
                  } ${idx % 2 === 1 ? "bg-white" : "bg-[#FBF8F0]/20"}`}
                >
                  <td className="sticky left-0 z-10 bg-inherit px-4 py-3 backdrop-blur-sm">
                    <p className="font-semibold text-navy-900">{row.namaBaku}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-400">
                      {row.kodeBahan}
                      <span className="mx-1 text-slate-300">·</span>
                      {row.kategori}
                    </p>
                  </td>
                  {lokasiColumns.map((loc) => {
                    const qty = row.lokasiQty[loc.kode] ?? 0;
                    const isWarehouse = loc.kode === "GDG";
                    return (
                      <td
                        key={loc.kode}
                        className={`px-3 py-3 text-center font-mono text-sm tabular-nums ${qtyCellClass(qty, isWarehouse)} ${lokasiHeaderClass(loc.kode)}/30`}
                      >
                        {formatQty(qty)}
                        <span className="block text-[9px] font-sans font-normal text-slate-400">
                          {row.satuanPakai}
                        </span>
                      </td>
                    );
                  })}
                  <td className="px-3 py-3 text-center font-bold tabular-nums text-navy-900">
                    {formatQty(row.totalQty)}
                  </td>
                  <td className="px-3 py-3 text-center tabular-nums text-slate-500">
                    {formatQty(row.stokMinimum)}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <InventoryStatusBadge status={row.status} size="xs" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
