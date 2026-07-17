import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { getShiftSummary, getCashDrawerSummary } from "@/lib/pos-service";
import { closeShiftAction } from "../../pos-actions";
import { requirePosSession } from "@/lib/pos-auth";
import { UI_FLAGS } from "@/lib/ui-flags";
import { buildPosDrawerContext } from "@/lib/pos-drawer-context";
import { hasFloorPlan } from "@/lib/pos-floor";
import { listOnlinePendingOrders } from "@/lib/pos-service";
import { ShiftSummaryCard } from "@/components/pos/ShiftSummaryCard";
import { PosSubPageShell } from "@/components/pos/PosSubPageShell";
import { PosSubPageAlerts } from "@/components/pos/PosSubPageAlerts";

export default function PosClosePage({
  searchParams
}: {
  searchParams: { outlet?: string; shift?: string; error?: string };
}) {
  const session = requirePosSession();

  const shiftId = searchParams.shift;
  if (!shiftId) redirect("/pos");

  const summary = getShiftSummary(shiftId);
  if (!summary) redirect("/pos");

  const { shift, orders, openCount, heldCount, completedCount } = summary;
  const drawer = getCashDrawerSummary(shift.id);
  const outlet = OUTLETS.find((o) => o.id === shift.outletId);
  const outletId = searchParams.outlet ?? shift.outletId;
  const useV2 = UI_FLAGS.posLayoutV2;
  const useOps = UI_FLAGS.uiOpsV1;
  const drawerCtx =
    useV2 && UI_FLAGS.posDrawerNavV1
      ? buildPosDrawerContext({
          session,
          outletId,
          outletName: outlet?.name ?? outletId,
          shift,
          onlinePending: listOnlinePendingOrders(shift.id).length,
          hasFloor: hasFloorPlan(outletId)
        })
      : undefined;

  const closeForm = (
    <form action={closeShiftAction} className="mt-6 grid gap-4">
      <input type="hidden" name="outletId" value={outletId} />
      <input type="hidden" name="shiftId" value={shift.id} />
      {drawer && (
        <div>
          <label htmlFor="physicalCash" className="nf3-field-label">
            Uang fisik di laci (opsional)
          </label>
          <input
            id="physicalCash"
            name="physicalCash"
            type="number"
            min={0}
            step={1000}
            placeholder={`Perkiraan sistem: ${drawer.expectedCash}`}
            className="nf3-input mt-1 py-3 text-base"
          />
          <p className="mt-1 text-xs text-slate-500">
            Hitung uang tunai fisik. Selisih dicatat netral di form setoran untuk verifikasi leader.
          </p>
        </div>
      )}
      <button
        type="submit"
        disabled={openCount > 0}
        className={`${useV2 ? "pos-cta-primary" : "btn-primary w-full py-4 text-base"} disabled:opacity-50`}
      >
        Tutup Shift & Kirim Setoran
      </button>
      {openCount > 0 && (
        <p className="mt-2 text-center text-xs text-amber-800">
          Selesaikan atau tahan semua bill terbuka sebelum menutup shift.
        </p>
      )}
    </form>
  );

  const legacyBody = (
    <>
      <h1 className="text-xl font-black text-navy-900">Tutup Shift</h1>
      <p className="text-sm text-slate-600">
        {outlet?.name} · Shift {shift.shiftLabel}
      </p>
      <div className="my-6 grid grid-cols-2 gap-3">
        {[
          { label: "Cash", value: shift.systemCashTotal ?? 0 },
          { label: "QRIS", value: shift.systemQrisTotal ?? 0 },
          { label: "Online", value: shift.systemOnlineTotal ?? 0 },
          { label: "Total Penjualan", value: shift.systemGrandTotal ?? 0 }
        ].map((w) => (
          <div key={w.label} className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">{w.label}</p>
            <p className="mt-1 text-lg font-black text-navy-900">{formatRp(w.value)}</p>
          </div>
        ))}
      </div>
      <p className="mb-4 text-sm text-slate-600">
        {completedCount} order selesai
        {openCount > 0 && (
          <span className="font-bold text-rose-700">
            {" "}
            · {openCount} order belum selesai
            {(heldCount ?? 0) > 0 && ` (${heldCount} hold)`}
          </span>
        )}
      </p>
      {drawer && (
        <div className="mb-4 rounded-xl border border-navy-100 bg-slate-50 p-4 text-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Perkiraan laci kas</p>
          <p className="mt-1 text-lg font-black text-navy-900">{formatRp(drawer.expectedCash)}</p>
          <Link
            href={`/pos/drawer?outlet=${outletId}&shift=${shift.id}`}
            className="mt-1 inline-block text-xs font-bold text-navy-700 underline"
          >
            Detail pay in/out →
          </Link>
        </div>
      )}
      {orders.length > 0 && (
        <ul className="mb-6 max-h-40 overflow-y-auto text-sm">
          {orders.map((o) => (
            <li key={o.id} className="flex justify-between border-b border-slate-50 py-1">
              <span>{o.orderNumber}</span>
              <span>
                {formatRp(o.total)} · {o.status}
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        Setelah tutup shift, sistem buat <strong>Form Setoran Kasir</strong> untuk verifikasi leader.
        Kas sudah tercatat per order di buku kas — approval tidak double-count.
      </div>
    </>
  );

  const summaryBody =
    useV2 || useOps ? (
      <ShiftSummaryCard
        variant="close"
        shift={shift}
        outletName={outlet?.name}
        outletId={outletId}
        completedCount={completedCount}
        openCount={openCount}
        heldCount={heldCount}
        drawer={drawer}
        orders={orders}
      />
    ) : (
      legacyBody
    );

  if (useV2) {
    return (
      <PosSubPageShell
        outletId={outletId}
        outletName={outlet?.name ?? outletId}
        shiftLabel={shift.shiftLabel}
        title="Tutup Shift"
        subtitle="ringkasan penjualan & setoran"
        width="md"
        drawerCtx={drawerCtx}
      >
        <PosSubPageAlerts error={searchParams.error} />
        <div className="pos-panel p-6">
          {summaryBody}
          {closeForm}
        </div>
      </PosSubPageShell>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <Link href={`/pos?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
        ← Kembali ke POS
      </Link>
      <div className="mt-4 panel p-6">
        <PosSubPageAlerts error={searchParams.error} />
        {summaryBody}
        {closeForm}
      </div>
    </main>
  );
}
