import { redirect } from "next/navigation";
import { UI_FLAGS } from "@/lib/ui-flags";
import { requirePosSession } from "@/lib/pos-auth";
import { resolvePosDrawerOutlet } from "@/lib/pos-page-common";
import { buildSalesRecap, defaultRecapRange } from "@/lib/pos-sales-history";
import { PosDrawerLayout } from "@/components/pos/PosDrawerLayout";
import { PosSubPageShell } from "@/components/pos/PosSubPageShell";
import { PosSalesRecapForm } from "@/components/pos/PosSalesHistoryFilters";
import { PosSalesRecapPanel } from "@/components/pos/PosSalesRecapPanel";
import { AlertBanner } from "@/components/ui/AlertBanner";

export default function PosRecapPage({
  searchParams
}: {
  searchParams: { outlet?: string; from?: string; to?: string };
}) {
  const session = requirePosSession();
  if (!["leader", "admin", "owner"].includes(session.role)) {
    redirect(`/pos?outlet=${searchParams.outlet ?? session.outletId ?? ""}`);
  }

  const { outletId, outlet, shift, ctx } = resolvePosDrawerOutlet(searchParams, session);
  const useDrawer = UI_FLAGS.posLayoutV2 && UI_FLAGS.posDrawerNavV1;
  const defaults = defaultRecapRange();
  const from = searchParams.from ?? defaults.from;
  const to = searchParams.to ?? defaults.to;
  const recap = buildSalesRecap(outletId, from, to);
  const rangeError = !recap;

  const body = (
    <div className="mx-auto max-w-lg space-y-4">
      <header>
        <h2 className="text-lg font-black text-navy-900">Detail Rekapitulasi</h2>
        <p className="text-sm text-slate-600">{outlet.name}</p>
      </header>

      <PosSalesRecapForm outletId={outletId} from={from} to={to} />

      {rangeError ? (
        <AlertBanner tone="warning">Rentang tanggal tidak valid — periksa tanggal mulai dan akhir.</AlertBanner>
      ) : (
        <PosSalesRecapPanel outletId={outletId} recap={recap} />
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
      title="Detail Rekapitulasi"
    >
      {body}
    </PosSubPageShell>
  );
}
