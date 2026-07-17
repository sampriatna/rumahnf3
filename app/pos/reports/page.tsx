import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { isPosOutlet } from "@/lib/pos-seed";
import { getOpenShift, getShiftSalesReport } from "@/lib/pos-service";
import { channelDisplayName } from "@/lib/channel-service";
import { requirePosSession } from "@/lib/pos-auth";

export default function PosReportsPage({
  searchParams
}: {
  searchParams: { outlet?: string };
}) {
  const session = requirePosSession();

  const outletId =
    searchParams.outlet && (session.role === "owner" || session.role === "admin")
      ? searchParams.outlet
      : session.outletId ?? searchParams.outlet;

  if (!outletId || !isPosOutlet(outletId)) redirect("/pos");

  const shift = getOpenShift(outletId);
  if (!shift) redirect(`/pos?outlet=${outletId}`);

  const report = getShiftSalesReport(shift.id)!;
  const outlet = OUTLETS.find((o) => o.id === outletId)!;

  return (
    <main className="mx-auto max-w-lg px-5 py-8 pb-24">
      <Link href={`/pos?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
        ← POS
      </Link>
      <h1 className="mt-2 text-xl font-black text-navy-900">Laporan Shift · {outlet.name}</h1>
      <p className="text-sm text-slate-600">
        {shift.shiftLabel} · dibuka {new Date(shift.openedAt).toLocaleString("id-ID")}
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="panel p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Penjualan kotor</p>
          <p className="text-2xl font-black text-navy-900">{formatRp(report.grossSales)}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Penjualan neto</p>
          <p className="text-2xl font-black text-emerald-700">{formatRp(report.netSales)}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Order selesai</p>
          <p className="text-2xl font-black text-navy-900">{report.completedOrders.length}</p>
        </div>
        <div className="panel p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Diskon</p>
          <p className="text-2xl font-black text-amber-700">{formatRp(report.totalDiscount)}</p>
        </div>
      </div>

      {report.drawerExpected != null && (
        <div className="mt-4 panel p-4">
          <p className="text-xs font-bold uppercase text-slate-500">Kas di laci (perkiraan)</p>
          <p className="text-xl font-black text-navy-900">{formatRp(report.drawerExpected)}</p>
        </div>
      )}

      <section className="mt-6 panel p-4">
        <h2 className="text-sm font-bold uppercase text-slate-500">Per metode bayar</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {Object.entries(report.byPayment).map(([method, amount]) => (
            <li key={method} className="flex justify-between">
              <span className="uppercase">{method}</span>
              <span className="font-bold">{formatRp(amount)}</span>
            </li>
          ))}
          {Object.keys(report.byPayment).length === 0 && (
            <li className="text-slate-500">Belum ada penjualan.</li>
          )}
        </ul>
      </section>

      <section className="mt-4 panel p-4">
        <h2 className="text-sm font-bold uppercase text-slate-500">Per channel</h2>
        <ul className="mt-3 space-y-1 text-sm">
          {Object.entries(report.byChannel).map(([ch, amount]) => (
            <li key={ch} className="flex justify-between">
              <span>{channelDisplayName(outletId, ch)}</span>
              <span className="font-bold">{formatRp(amount)}</span>
            </li>
          ))}
        </ul>
      </section>

      {report.topItems.length > 0 && (
        <section className="mt-4 panel p-4">
          <h2 className="text-sm font-bold uppercase text-slate-500">Top menu</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {report.topItems.map((row) => (
              <li key={row.name} className="flex justify-between gap-2">
                <span>
                  {row.name}{" "}
                  <span className="text-xs text-slate-500">×{row.qty}</span>
                </span>
                <span className="font-bold">{formatRp(row.revenue)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-4 panel p-4 text-sm">
        <div className="flex justify-between">
          <span>Void order</span>
          <span className="font-bold">{report.voidCount}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span>Cetak ulang struk</span>
          <span className="font-bold">{report.reprintCount}</span>
        </div>
        <div className="mt-1 flex justify-between">
          <span>Order online pending</span>
          <span className="font-bold">{report.onlinePending}</span>
        </div>
      </section>
    </main>
  );
}
