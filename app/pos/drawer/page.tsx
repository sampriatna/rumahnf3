import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { getOpenShift, getCashDrawerSummary } from "@/lib/pos-service";
import { cashDrawerEntryAction } from "../../pos-actions";
import { requirePosSession } from "@/lib/pos-auth";
import { UI_FLAGS } from "@/lib/ui-flags";
import { buildPosDrawerContext } from "@/lib/pos-drawer-context";
import { hasFloorPlan } from "@/lib/pos-floor";
import { listOnlinePendingOrders } from "@/lib/pos-service";
import { ShiftSummaryCard } from "@/components/pos/ShiftSummaryCard";
import { CashDrawerForm, CashDrawerEntryList } from "@/components/pos/CashDrawerForm";
import { PosSubPageShell } from "@/components/pos/PosSubPageShell";
import { PosSubPageAlerts } from "@/components/pos/PosSubPageAlerts";

export default function PosDrawerPage({
  searchParams
}: {
  searchParams: { outlet?: string; shift?: string; error?: string; ok?: string };
}) {
  const session = requirePosSession();

  const outletId = searchParams.outlet ?? session.outletId;
  const shift = searchParams.shift
    ? getCashDrawerSummary(searchParams.shift)?.shift
    : outletId
      ? getOpenShift(outletId)
      : undefined;

  if (!shift || shift.status !== "open") {
    redirect(outletId ? `/pos?outlet=${outletId}` : "/pos");
  }

  const summary = getCashDrawerSummary(shift.id)!;
  const outlet = OUTLETS.find((o) => o.id === shift.outletId);
  const useV2 = UI_FLAGS.posLayoutV2;
  const useOps = UI_FLAGS.uiOpsV1;
  const drawerCtx =
    useV2 && UI_FLAGS.posDrawerNavV1
      ? buildPosDrawerContext({
          session,
          outletId: shift.outletId,
          outletName: outlet?.name ?? shift.outletId,
          shift,
          onlinePending: listOnlinePendingOrders(shift.id).length,
          hasFloor: hasFloorPlan(shift.outletId)
        })
      : undefined;

  const legacyBody = (
    <>
      <h1 className="text-xl font-black text-navy-900">Laci Kas</h1>
      <p className="text-sm text-slate-600">
        {outlet?.name} · Shift {shift.shiftLabel}
      </p>
      <div className="my-6 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Modal awal</p>
          <p className="mt-1 font-black text-navy-900">{formatRp(shift.openingFloat)}</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs text-slate-500">Penjualan cash</p>
          <p className="mt-1 font-black text-navy-900">{formatRp(shift.systemCashTotal ?? 0)}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-xs text-slate-500">Pay in</p>
          <p className="mt-1 font-black text-emerald-800">{formatRp(summary.payIn)}</p>
        </div>
        <div className="rounded-xl bg-rose-50 p-4">
          <p className="text-xs text-slate-500">Pay out</p>
          <p className="mt-1 font-black text-rose-800">{formatRp(summary.payOut)}</p>
        </div>
      </div>
      <div className="mb-6 rounded-xl border-2 border-navy-200 bg-navy-50 p-4 text-center">
        <p className="text-xs font-bold uppercase text-slate-500">Perkiraan uang di laci</p>
        <p className="mt-1 text-2xl font-black text-navy-900">{formatRp(summary.expectedCash)}</p>
        <p className="mt-1 text-xs text-slate-500">Modal + cash penjualan + pay in − pay out</p>
      </div>
    </>
  );

  const summaryBody =
    useV2 || useOps ? (
      <ShiftSummaryCard
        variant="drawer"
        shift={shift}
        outletName={outlet?.name}
        outletId={shift.outletId}
        drawer={summary}
      />
    ) : (
      legacyBody
    );

  const legacyForm = (
    <form action={cashDrawerEntryAction} className="mb-6 grid gap-3 border-t border-slate-100 pt-4">
      <input type="hidden" name="outletId" value={shift.outletId} />
      <input type="hidden" name="shiftId" value={shift.id} />
      <select name="type" className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">
        <option value="pay_in">Pay In (masuk laci)</option>
        <option value="pay_out">Pay Out (keluar laci)</option>
      </select>
      <input
        name="amount"
        type="number"
        required
        min={1}
        placeholder="Nominal (Rp)"
        className="rounded-xl border border-slate-200 px-4 py-3 text-base"
      />
      <input
        name="reason"
        type="text"
        required
        placeholder="Alasan (mis. isi kembalian, beli es batu)"
        className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
      />
      <button type="submit" className="btn-primary py-3 text-sm">
        Simpan Catatan
      </button>
    </form>
  );

  const legacyEntries =
    summary.entries.length > 0 ? (
      <>
        <h2 className="mb-2 text-xs font-bold uppercase text-slate-500">Riwayat shift ini</h2>
        <ul className="max-h-48 space-y-2 overflow-y-auto text-sm">
          {summary.entries.map((e) => (
            <li key={e.id} className="flex justify-between gap-2 border-b border-slate-50 pb-2">
              <span>
                <span className={e.type === "pay_in" ? "text-emerald-700" : "text-rose-700"}>
                  {e.type === "pay_in" ? "IN" : "OUT"}
                </span>{" "}
                {e.reason}
                <span className="block text-xs text-slate-400">{e.createdBy}</span>
              </span>
              <span className="font-semibold">{formatRp(e.amount)}</span>
            </li>
          ))}
        </ul>
      </>
    ) : null;

  const panelContent = (
    <>
      <PosSubPageAlerts error={searchParams.error} ok={searchParams.ok} />
      {summaryBody}
      {useV2 ? (
        <CashDrawerForm outletId={shift.outletId} shiftId={shift.id} />
      ) : (
        legacyForm
      )}
      {useV2 ? (
        <CashDrawerEntryList entries={summary.entries} />
      ) : (
        legacyEntries
      )}
    </>
  );

  if (useV2) {
    return (
      <PosSubPageShell
        outletId={shift.outletId}
        outletName={outlet?.name ?? shift.outletId}
        shiftLabel={shift.shiftLabel}
        title="Laci Kas"
        subtitle="pay in / pay out & perkiraan uang fisik"
        width="md"
        drawerCtx={drawerCtx}
      >
        <div className="pos-panel p-6">{panelContent}</div>
      </PosSubPageShell>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <Link href={`/pos?outlet=${shift.outletId}`} className="text-sm font-bold text-navy-700">
        ← Kembali ke POS
      </Link>
      <div className="mt-4 panel p-6">{panelContent}</div>
    </main>
  );
}
