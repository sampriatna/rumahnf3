"use client";

import Link from "next/link";
import { useState } from "react";
import { Clock, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import type { CheckerOrderView } from "@/lib/checker-service";
import { formatKdsTimer } from "@/lib/kds-theme";
import { OpStatusBadge } from "@/components/ui/OpStatusBadge";

export function CheckerBoard({
  orders,
  outletName,
  outletId
}: {
  orders: CheckerOrderView[];
  outletName: string;
  outletId: string;
}) {
  const [selectedId, setSelectedId] = useState(orders[0]?.orderId ?? "");
  const selected = orders.find((o) => o.orderId === selectedId) ?? orders[0];

  if (orders.length === 0) {
    return (
      <div className="panel flex flex-col items-center gap-3 p-12 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" aria-hidden />
        <p className="text-lg font-bold text-navy-900">Tidak ada pesanan aktif</p>
        <p className="text-sm text-slate-600">
          Semua pesanan di {outletName} sudah selesai atau belum ada order shift ini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <section className="panel min-h-[20rem] overflow-hidden">
        <h2 className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-400">
          Antrian ({orders.length})
        </h2>
        <ul className="max-h-[32rem] divide-y divide-slate-100 overflow-y-auto">
          {orders.map((o) => {
            const active = o.orderId === selected?.orderId;
            return (
              <li key={o.orderId}>
                <button
                  type="button"
                  onClick={() => setSelectedId(o.orderId)}
                  className={`w-full px-4 py-3 text-left transition ${
                    active ? "bg-navy-50" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-navy-900">{o.orderNumber}</p>
                      <p className="truncate text-xs text-slate-500">
                        {o.tableLabel ?? o.channelLabel}
                      </p>
                    </div>
                    <OpStatusBadge tone={o.overallReady ? "ready" : "progress"}>
                      {o.readinessLabel}
                    </OpStatusBadge>
                  </div>
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-400">
                    <Clock className="h-3 w-3" aria-hidden />
                    {formatKdsTimer(o.elapsedSec)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {selected && (
        <section className="panel p-4">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-navy-900">{selected.orderNumber}</h2>
              <p className="text-sm text-slate-600">
                {selected.tableLabel ?? selected.channelLabel}
              </p>
            </div>
            <OpStatusBadge tone={selected.overallReady ? "success" : "progress"}>
              {selected.readinessLabel}
            </OpStatusBadge>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {selected.stations.map((st) => (
              <div
                key={st.stationId}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
              >
                <p className="font-bold text-navy-800">{st.stationName}</p>
                <p className="text-slate-600">
                  {st.readyCount}/{st.itemCount} siap · {st.statusLabel}
                </p>
              </div>
            ))}
          </div>

          {!selected.overallReady && selected.waitingStation && (
            <p className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
              Menunggu: {selected.waitingStation}
            </p>
          )}

          <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">Detail Item</h3>
          <ul className="space-y-2">
            {selected.items.map((it, idx) => (
              <li key={`${it.name}-${idx}`} className="rounded-lg border border-slate-100 px-3 py-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-navy-900">
                    {it.qty}× {it.name}
                  </p>
                  <OpStatusBadge tone={it.status === "siap" ? "ready" : "progress"}>
                    {it.statusLabel}
                  </OpStatusBadge>
                </div>
                <p className="text-[11px] text-slate-500">{it.stationName}</p>
                {it.modifiers.length > 0 && (
                  <p className="mt-1 text-xs font-semibold text-slate-700">{it.modifiers.join(" · ")}</p>
                )}
                {it.notes && (
                  <p className="mt-1 rounded bg-amber-50 px-2 py-1 text-xs font-bold text-amber-900">
                    {it.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href={`/pos/checkout/${selected.orderId}?outlet=${outletId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-navy-200 bg-navy-50 px-3 py-2 text-xs font-bold text-navy-800 transition hover:bg-navy-100"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Bayar di POS
            </Link>
            <Link
              href={`/kds?outlet=${outletId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Buka KDS
            </Link>
          </div>
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
            Tandai selesai dari Checker — segera hadir (fase berikutnya, read-only dulu).
          </p>
        </section>
      )}
    </div>
  );
}
