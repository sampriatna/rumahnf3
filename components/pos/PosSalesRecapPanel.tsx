import { formatRp } from "@/lib/finance";
import { channelDisplayName } from "@/lib/channel-service";
import type { SalesRecapResult } from "@/lib/pos-sales-history";
import { formatPosDateLabel } from "@/lib/pos-sales-history";
import { StatCard } from "@/components/ui/StatCard";

export function PosSalesRecapPanel({
  outletId,
  recap
}: {
  outletId: string;
  recap: SalesRecapResult;
}) {
  const hasData = recap.transactionCount > 0 || recap.outletExpensesTotal > 0;

  if (!hasData) {
    return (
      <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
        Data tidak ditemukan untuk periode {formatPosDateLabel(recap.fromDate)} –{" "}
        {formatPosDateLabel(recap.toDate)}.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Periode {formatPosDateLabel(recap.fromDate)} – {formatPosDateLabel(recap.toDate)} ·{" "}
        <span className="font-bold text-navy-900">{recap.transactionCount} transaksi</span>
        {recap.completedCount !== recap.transactionCount && (
          <span> ({recap.completedCount} selesai)</span>
        )}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Penjualan Kotor" value={formatRp(recap.grossSales)} />
        <StatCard label="Penjualan Neto" value={formatRp(recap.netSales)} tone="success" />
        <StatCard label="Diskon" value={formatRp(recap.totalDiscount)} tone="warning" />
        <StatCard
          label="Pengeluaran Outlet"
          value={formatRp(recap.outletExpensesTotal)}
          tone="warning"
        />
        <StatCard label="Shift" value={String(recap.shiftCount)} />
        <StatCard label="Void" value={String(recap.voidCount)} tone="neutral" />
      </div>

      {Object.keys(recap.byPayment).length > 0 && (
        <section className="pos-panel p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Per Metode Bayar
          </h3>
          <ul className="mt-3 space-y-1 text-sm">
            {Object.entries(recap.byPayment).map(([method, amount]) => (
              <li key={method} className="flex justify-between">
                <span className="uppercase">{method}</span>
                <span className="font-bold">{formatRp(amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {Object.keys(recap.byChannel).length > 0 && (
        <section className="pos-panel p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Per Channel
          </h3>
          <ul className="mt-3 space-y-1 text-sm">
            {Object.entries(recap.byChannel).map(([ch, amount]) => (
              <li key={ch} className="flex justify-between">
                <span>{channelDisplayName(outletId, ch)}</span>
                <span className="font-bold">{formatRp(amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
