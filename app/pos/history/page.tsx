import { UI_FLAGS } from "@/lib/ui-flags";
import { requirePosSession } from "@/lib/pos-auth";
import { resolvePosDrawerOutlet } from "@/lib/pos-page-common";
import {
  querySalesHistory,
  formatPosDateLabel
} from "@/lib/pos-sales-history";
import { PosDrawerLayout } from "@/components/pos/PosDrawerLayout";
import { PosSubPageShell } from "@/components/pos/PosSubPageShell";
import { PosSalesHistoryFilters } from "@/components/pos/PosSalesHistoryFilters";
import { PosHistoryOrderRow } from "@/components/pos/PosHistoryOrderRow";

export default function PosHistoryPage({
  searchParams
}: {
  searchParams: {
    outlet?: string;
    date?: string;
    q?: string;
    status?: string;
    payment?: string;
  };
}) {
  const session = requirePosSession();
  const { outletId, outlet, shift, ctx } = resolvePosDrawerOutlet(searchParams, session);
  const useDrawer = UI_FLAGS.posLayoutV2 && UI_FLAGS.posDrawerNavV1;

  const { date, orders } = querySalesHistory(outletId, {
    date: searchParams.date,
    q: searchParams.q,
    status: searchParams.status as Parameters<typeof querySalesHistory>[1]["status"],
    payment: searchParams.payment as Parameters<typeof querySalesHistory>[1]["payment"]
  });

  const body = (
    <div className="mx-auto max-w-lg space-y-4">
      <header>
        <h2 className="text-lg font-black text-navy-900">
          Penjualan Tanggal | {formatPosDateLabel(date)}
        </h2>
        <p className="text-sm text-slate-600">
          {outlet.name} · <span className="font-bold text-navy-800">{orders.length} TRANSAKSI</span>
        </p>
      </header>

      <PosSalesHistoryFilters
        outletId={outletId}
        date={date}
        q={searchParams.q}
        status={searchParams.status}
        payment={searchParams.payment}
      />

      {orders.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
          Belum ada riwayat penjualan untuk filter ini.
        </p>
      ) : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <PosHistoryOrderRow key={o.id} order={o} outletId={outletId} />
          ))}
        </ul>
      )}
    </div>
  );

  if (useDrawer) {
    return (
      <PosDrawerLayout ctx={ctx}>
        <main className="flex-1 px-4 py-6">{body}</main>
      </PosDrawerLayout>
    );
  }

  return (
    <PosSubPageShell
      outletId={outletId}
      outletName={outlet.name}
      shiftLabel={shift?.shiftLabel ?? "—"}
      title="Riwayat Penjualan"
      subtitle={formatPosDateLabel(date)}
    >
      {body}
    </PosSubPageShell>
  );
}
