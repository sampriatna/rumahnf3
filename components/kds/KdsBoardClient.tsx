"use client";

import { useEffect, useRef } from "react";
import { Clock, Flame, CheckCircle2 } from "lucide-react";
import type { KdsOrderTicket, KdsStationId } from "@/types/kds";
import { KdsOrderCard } from "./KdsOrderCard";
import { KdsAlertMonitor } from "./KdsAlertMonitor";
import { KdsBoardSummary } from "./KdsBoardSummary";

type Column = {
  key: "baru" | "diproces" | "siap";
  label: string;
  tickets: KdsOrderTicket[];
};

const COL_CONFIG = {
  baru: {
    Icon: Clock,
    header: "bg-sky-600",
    label: "BARU"
  },
  diproces: {
    Icon: Flame,
    header: "bg-amber-500",
    label: "DIPROSES"
  },
  siap: {
    Icon: CheckCircle2,
    header: "bg-emerald-600",
    label: "SIAP"
  }
} as const;

type Props = {
  columns: Column[];
  outletId: string;
  stationId: KdsStationId;
  emptyHint?: string;
  showSummary?: boolean;
};

export function KdsBoardClient({ columns, outletId, stationId, emptyHint, showSummary }: Props) {
  const allTickets = columns.flatMap((c) => c.tickets);
  const knownIds = useRef<Set<string>>(new Set());
  const isEmpty = allTickets.length === 0;

  const newIds = new Set<string>();
  for (const t of allTickets) {
    if (!knownIds.current.has(t.ticketId)) newIds.add(t.ticketId);
    knownIds.current.add(t.ticketId);
  }

  useEffect(() => {
    knownIds.current = new Set(allTickets.map((t) => t.ticketId));
  }, [allTickets]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <KdsAlertMonitor tickets={allTickets} outletId={outletId} stationId={stationId} />

      {showSummary && <KdsBoardSummary columns={columns} />}

      {isEmpty && emptyHint && (
        <p className="mx-3 mt-3 shrink-0 rounded-lg bg-white/90 px-4 py-3 text-center text-sm font-semibold text-slate-700 shadow">
          {emptyHint}
        </p>
      )}

      {/* Kanban 3 kolom — standar KDS landscape */}
      <div className="grid min-h-0 flex-1 grid-cols-3 gap-1 p-1 md:gap-2 md:p-2">
        {columns.map((col) => {
          const cfg = COL_CONFIG[col.key];
          const Icon = cfg.Icon;
          return (
            <section key={col.key} className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg bg-white/40 shadow-inner">
              <div
                className={`flex shrink-0 items-center gap-2 px-3 py-2 text-white ${cfg.header}`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                <h2 className="text-sm font-black uppercase tracking-wide">{cfg.label}</h2>
                <span className="ml-auto rounded-full bg-black/25 px-2.5 py-0.5 text-xs font-black">
                  {col.tickets.length}
                </span>
              </div>

              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain p-2">
                {col.tickets.length === 0 ? (
                  <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-slate-400/60 bg-white/50 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Kosong
                  </div>
                ) : (
                  col.tickets.map((t) => (
                    <KdsOrderCard
                      key={t.ticketId}
                      ticket={t}
                      outletId={outletId}
                      stationId={stationId}
                      isNew={newIds.has(t.ticketId)}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
