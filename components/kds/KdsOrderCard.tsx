"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import type { KdsOrderTicket, KdsStationId } from "@/types/kds";
import { KDS_PROBLEM_OPTIONS } from "@/types/kds";
import {
  KDS_ORDER_THEME,
  kdsTimerTier,
  formatKdsTimer
} from "@/lib/kds-theme";
import { stationStatus, itemsForStation } from "@/lib/kds-board-utils";
import { kdsBoardProsesAction, kdsBoardSiapAction, kdsBoardProblemAction } from "@/app/kds-actions";

type Props = {
  ticket: KdsOrderTicket;
  outletId: string;
  stationId: KdsStationId;
  isNew?: boolean;
};

function HeaderTimer({ createdAt }: { createdAt: string }) {
  const [seconds, setSeconds] = useState(() =>
    Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000)
  );

  useEffect(() => {
    const id = setInterval(() => {
      setSeconds(Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  const tier = kdsTimerTier(seconds);
  const late = tier === "late" || tier === "orange";

  return (
    <span
      className={`font-mono text-sm font-black ${late ? "animate-pulse text-yellow-200" : "text-white/95"}`}
    >
      {formatKdsTimer(seconds)}
    </span>
  );
}

export function KdsOrderCard({ ticket, outletId, stationId, isNew }: Props) {
  const [showProblem, setShowProblem] = useState(false);
  const theme = KDS_ORDER_THEME[ticket.orderType];
  const st = stationStatus(ticket, stationId);
  const myItems = itemsForStation(ticket, stationId);

  const headline =
    ticket.orderType === "dine_in"
      ? ticket.tableNumber
        ? `Meja ${ticket.tableNumber}`
        : ticket.orderNumber
      : ticket.orderType === "takeaway"
        ? ticket.customerName ?? "Takeaway"
        : ticket.orderType === "ojol"
          ? ticket.channel ?? ticket.customerName ?? "Ojol"
          : ticket.customerName ?? ticket.orderNumber;

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-slate-300/80 ${
        isNew ? "ring-2 ring-rose-500 animate-pulse" : ""
      } ${st === "problem" ? "ring-2 ring-rose-600" : ""}`}
    >
      {/* Header warna = jenis order / kemasan (standar KDS) */}
      <div className={`shrink-0 px-3 py-2 text-white ${theme.headerSolid}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wide opacity-90">
            #{ticket.orderNumber}
          </span>
          <HeaderTimer createdAt={ticket.createdAt} />
        </div>
        <p className="truncate text-lg font-black leading-tight">{headline}</p>
        <p className="truncate text-[10px] font-bold uppercase opacity-90">
          {theme.packaging}
          {ticket.priority > 0 ? " · PRIORITAS" : ""}
        </p>
      </div>

      {/* Item list - teks gelap di kartu putih */}
      <ul className="max-h-48 flex-1 overflow-y-auto px-3 py-2">
        {myItems.map((it) => (
          <li
            key={it.itemId}
            className="border-b border-slate-100 py-1.5 last:border-0"
          >
            <p className="text-base font-black leading-snug text-slate-900">
              <span className="text-rose-600">{it.qty}×</span> {it.menuName}
            </p>
            {it.modifiers.length > 0 && (
              <p
                className={`text-xs font-semibold ${
                  stationId === "bar"
                    ? "rounded bg-violet-100 px-1.5 py-0.5 font-bold text-violet-900"
                    : "text-slate-600"
                }`}
              >
                {stationId === "bar" ? "Modifikasi: " : ""}
                {it.modifiers.join(" · ")}
              </p>
            )}
            {it.notes && (
              <p className="mt-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-900">
                {it.notes}
              </p>
            )}
          </li>
        ))}
      </ul>

      {ticket.notes && (
        <p className="mx-3 mb-1 rounded bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200">
          {ticket.notes}
        </p>
      )}

      {ticket.problemReason && (
        <p className="mx-3 mb-1 flex items-center gap-1 text-xs font-bold text-rose-600">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          {KDS_PROBLEM_OPTIONS.find((o) => o.value === ticket.problemReason)?.label}
        </p>
      )}

      {/* Tombol aksi - satu baris besar seperti KDS standar */}
      <div className="shrink-0 border-t border-slate-200 p-2">
        {st === "baru" || st === "problem" ? (
          <form action={kdsBoardProsesAction}>
            <input type="hidden" name="ticketId" value={ticket.ticketId} />
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="station" value={stationId} />
            <button
              type="submit"
              className="w-full rounded-md bg-slate-800 py-3.5 text-sm font-black uppercase tracking-wide text-white hover:bg-slate-700"
            >
              Proses
            </button>
          </form>
        ) : st === "diproces" ? (
          <form action={kdsBoardSiapAction}>
            <input type="hidden" name="ticketId" value={ticket.ticketId} />
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="station" value={stationId} />
            <button
              type="submit"
              className="w-full rounded-md bg-emerald-600 py-3.5 text-sm font-black uppercase tracking-wide text-white hover:bg-emerald-500"
            >
              Siap / Done
            </button>
          </form>
        ) : (
          <div className="rounded-md bg-emerald-100 py-3.5 text-center text-sm font-black uppercase text-emerald-800">
            Selesai ✓
          </div>
        )}

        {!showProblem ? (
          <button
            type="button"
            onClick={() => setShowProblem(true)}
            className="mt-1.5 w-full text-center text-[10px] font-bold uppercase text-slate-400 hover:text-rose-600"
          >
            Laporkan problem
          </button>
        ) : (
          <form action={kdsBoardProblemAction} className="mt-2 space-y-1.5">
            <input type="hidden" name="ticketId" value={ticket.ticketId} />
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="station" value={stationId} />
            <select name="reason" required className="kds-field w-full py-2 text-xs">
              {KDS_PROBLEM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input name="note" placeholder="Catatan" className="kds-field w-full py-2 text-xs" />
            <button
              type="submit"
              className="w-full rounded-md bg-rose-600 py-2 text-xs font-black text-white"
            >
              Simpan
            </button>
          </form>
        )}
      </div>
    </article>
  );
}
