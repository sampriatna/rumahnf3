"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  LayoutGrid,
  MoreHorizontal,
  Ban,
  ChefHat,
  Flame,
  Package
} from "lucide-react";
import type { MenuItem } from "@/lib/pos-kds-roadmap";
import type { KdsClosingChecklistItem } from "@/types/inventory";
import type { KdsOrderTicket, KdsStationId } from "@/types/kds";
import { KdsBoardClient } from "./KdsBoardClient";
import { KdsPackagingLegend } from "./KdsPackagingLegend";
import { KdsMenuStockPanel } from "./KdsMenuStockPanel";
import { KdsClosingPanel } from "./KdsClosingPanel";
import { KdsSoundSettingsPanel } from "./KdsSoundSettings";

type Tab = "orders" | "menu" | "closing" | "more";

type Column = {
  key: "baru" | "diproces" | "siap";
  label: string;
  tickets: KdsOrderTicket[];
};

const STATION_ICON: Record<string, typeof Flame> = {
  dapur: ChefHat,
  bar: Flame,
  packing: Package
};

const TAB_CONFIG: Array<{
  id: Tab;
  label: string;
  Icon: typeof LayoutGrid;
}> = [
  { id: "orders", label: "Order", Icon: LayoutGrid },
  { id: "menu", label: "Habis", Icon: Ban },
  { id: "closing", label: "Closing", Icon: ClipboardList },
  { id: "more", label: "Lainnya", Icon: MoreHorizontal }
];

export function KdsTabletShell({
  outletId,
  outletName,
  stationId,
  stationName,
  stations,
  servedToday,
  columns,
  menuItems,
  closingToday,
  checklist,
  optionalChecklist,
  wasteOptions,
  lokasi,
  closingMsg,
  closingError,
  soldOutBanner,
  initialTab = "orders",
  pendingOpname,
  soldOutCount,
  showSummary = false
}: {
  outletId: string;
  outletName: string;
  stationId: KdsStationId;
  stationName: string;
  stations: Array<{ id: string; name: string }>;
  servedToday: number;
  columns: Column[];
  menuItems: MenuItem[];
  closingToday: string;
  checklist: KdsClosingChecklistItem[];
  optionalChecklist: KdsClosingChecklistItem[];
  wasteOptions: Array<{ kodeBahan: string; namaBaku: string; satuanPakai: string }>;
  lokasi: string;
  closingMsg?: string;
  closingError?: string;
  soldOutBanner?: string;
  initialTab?: Tab;
  pendingOpname: number;
  soldOutCount: number;
  showSummary?: boolean;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const activeOrders = columns.reduce((n, c) => n + c.tickets.length, 0);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-300">
      {/* Top bar merah - standar KDS */}
      <header className="shrink-0 bg-rose-800 text-white shadow-md">
        <div className="flex items-center justify-between gap-3 px-4 py-2">
          <div className="min-w-0">
            <p className="truncate text-base font-black uppercase tracking-wide">
              KDS {stationName}
            </p>
            <p className="truncate text-xs font-semibold text-rose-100">{outletName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-xs font-bold">
            <span className="rounded bg-rose-900/80 px-2 py-1">{activeOrders} aktif</span>
            <span className="rounded bg-emerald-700 px-2 py-1">{servedToday} selesai</span>
          </div>
        </div>

        {tab === "orders" && (
          <div className="flex gap-1 overflow-x-auto border-t border-rose-600/50 px-3 py-1.5">
            {stations.map((st) => {
              const Icon = STATION_ICON[st.id] ?? Flame;
              const active = st.id === stationId;
              return (
                <Link
                  key={st.id}
                  href={`/kds?outlet=${outletId}&station=${st.id}`}
                  className={`flex shrink-0 items-center gap-1 rounded px-3 py-1.5 text-xs font-bold ${
                    active ? "bg-white text-rose-700" : "bg-rose-800/60 text-rose-100"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {st.name}
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Area konten - board abu (order) atau gelap (admin) */}
      <div
        className={`min-h-0 flex-1 overflow-hidden ${
          tab === "orders" ? "bg-zinc-300" : "overflow-y-auto bg-navy-950 px-3 py-3"
        }`}
      >
        {tab === "orders" && (
          <>
            {soldOutBanner && (
              <p className="mx-3 mt-2 shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-center text-xs font-bold text-white">
                {soldOutBanner}
              </p>
            )}
            <KdsBoardClient
              columns={columns}
              outletId={outletId}
              stationId={stationId}
              emptyHint="Belum ada order - buat di POS lalu Kirim Dapur."
              showSummary={showSummary}
            />
          </>
        )}

        {tab === "menu" && (
          <KdsMenuStockPanel
            embedded
            outletId={outletId}
            stationId={stationId}
            stationName={stationName}
            items={menuItems}
          />
        )}

        {tab === "closing" && (
          <KdsClosingPanel
            embedded
            outletId={outletId}
            stationId={stationId}
            stationName={stationName}
            today={closingToday}
            checklist={checklist}
            optionalChecklist={optionalChecklist}
            wasteOptions={wasteOptions}
            lokasi={lokasi}
            closingMsg={closingMsg}
            closingError={closingError}
          />
        )}

        {tab === "more" && (
          <div className="space-y-3 text-white">
            <section className="rounded-xl border border-navy-700 bg-navy-900 p-4">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gold-400">
                Pengaturan
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <KdsSoundSettingsPanel />
                <Link
                  href="/pos"
                  className="rounded-xl bg-navy-800 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-navy-700"
                >
                  POS
                </Link>
                <Link
                  href={`/kds?outlet=${outletId}`}
                  className="rounded-xl bg-navy-800 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-navy-700"
                >
                  Ganti station
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-navy-800 px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-navy-700"
                >
                  Dashboard
                </Link>
              </div>
            </section>
            <section className="rounded-xl border border-navy-700 bg-navy-900 p-4">
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gold-400">
                Legenda warna header
              </h2>
              <KdsPackagingLegend />
            </section>
          </div>
        )}
      </div>

      {/* Bottom dock - administrasi */}
      <nav
        className="shrink-0 border-t-2 border-rose-800 bg-rose-700 pb-[max(0.35rem,env(safe-area-inset-bottom))] text-white"
        aria-label="Navigasi KDS"
      >
        <div className="grid grid-cols-4 gap-0.5 px-1 pt-1">
          {TAB_CONFIG.map(({ id, label, Icon }) => {
            const active = tab === id;
            const badge =
              id === "orders"
                ? activeOrders
                : id === "menu"
                  ? soldOutCount
                  : id === "closing"
                    ? pendingOpname
                    : 0;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`relative flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-2 transition ${
                  active ? "bg-white text-rose-700" : "text-rose-100 hover:bg-rose-600"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-5 w-5" aria-hidden />
                <span className="text-[10px] font-black uppercase tracking-wide">{label}</span>
                {badge > 0 && (
                  <span
                    className={`absolute right-1.5 top-1 min-w-[1rem] rounded-full px-1 text-center text-[9px] font-black leading-4 ${
                      active ? "bg-rose-600 text-white" : "bg-yellow-400 text-rose-900"
                    }`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
