import { formatRp } from "@/lib/finance";
import type { PosSalesSnapshot } from "@/lib/pos-report-snapshot";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";

export function PosSalesPanel({ snapshot }: { snapshot: PosSalesSnapshot }) {
  if (snapshot.byOutlet.length === 0 && snapshot.totalOmzet === 0) {
    return (
      <EmptyState
        className="mb-6"
        title="Belum ada penjualan POS hari ini"
        description="Buka shift di outlet F&B untuk mulai mencatat omzet."
      />
    );
  }

  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
        Penjualan POS · {snapshot.dateLabel}
      </h2>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Omzet POS Hari Ini" value={formatRp(snapshot.totalOmzet)} tone="success" />
        <StatCard
          label="Pesanan Selesai"
          value={String(snapshot.totalOrders)}
          hint="Order completed hari ini"
        />
        <StatCard
          label="Outlet Aktif"
          value={String(snapshot.byOutlet.length)}
          hint="Ada shift atau penjualan"
        />
      </div>
      {snapshot.byOutlet.length > 0 && (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <th className="p-3">Outlet</th>
                <th className="p-3">Selesai</th>
                <th className="p-3">Omzet</th>
                <th className="p-3">Shift</th>
              </tr>
            </thead>
            <tbody>
              {snapshot.byOutlet.map((row) => (
                <tr key={row.outletId} className="border-b border-slate-50">
                  <td className="p-3 font-semibold text-navy-900">{row.outletName}</td>
                  <td className="p-3">{row.completedOrders}</td>
                  <td className="p-3 font-bold">{formatRp(row.omzetCompleted)}</td>
                  <td className="p-3 text-xs text-slate-600">
                    {row.shiftOpen
                      ? `${row.shiftLabel} · live ${formatRp(row.shiftOmzetLive ?? 0)}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
