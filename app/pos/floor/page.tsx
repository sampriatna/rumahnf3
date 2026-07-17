import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { isPosOutlet } from "@/lib/pos-seed";
import { hasFloorPlan, buildFloorState } from "@/lib/pos-floor";
import {
  getOpenShift,
  listShiftOrders,
  countOrderPendingItems
} from "@/lib/pos-service";
import { requirePosSession } from "@/lib/pos-auth";
import { UI_FLAGS } from "@/lib/ui-flags";
import { FloorLegend, FloorStats } from "@/components/pos/TableCard";
import { FloorTableTile } from "@/components/pos/FloorTableTile";
import { PosSubPageShell, PosSubPageAction } from "@/components/pos/PosSubPageShell";
import { PosSubPageAlerts } from "@/components/pos/PosSubPageAlerts";

export default function PosFloorPage({
  searchParams
}: {
  searchParams: { outlet?: string; table?: string; error?: string; ok?: string };
}) {
  const session = requirePosSession();

  const outletId =
    searchParams.outlet && (session.role === "owner" || session.role === "admin")
      ? searchParams.outlet
      : session.outletId ?? searchParams.outlet;

  if (!outletId || !isPosOutlet(outletId) || !hasFloorPlan(outletId)) {
    redirect("/pos");
  }

  const shift = getOpenShift(outletId);
  if (!shift) redirect(`/pos?outlet=${outletId}`);

  const outlet = OUTLETS.find((o) => o.id === outletId)!;
  const orders = listShiftOrders(shift.id);
  const floor = buildFloorState(outletId, shift.id, orders, countOrderPendingItems);
  const zones = [...new Set(floor.map((t) => t.zone ?? "Area"))];
  const emptyLabels = floor.filter((t) => t.status === "empty").map((t) => t.label);
  const useV2 = UI_FLAGS.posLayoutV2;
  const useOps = UI_FLAGS.uiOpsV1;

  const zoneSections = zones.map((zone) => {
    const zoneTables = floor.filter((t) => (t.zone ?? "Area") === zone);
    return (
      <section key={zone} className="mb-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">{zone}</h2>
        <div
          className={
            useV2 || useOps
              ? "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              : "grid grid-cols-2 gap-3 sm:grid-cols-4"
          }
        >
          {(useV2 || useOps
            ? zoneTables.map((table) => (
                <FloorTableTile
                  key={table.id}
                  table={table}
                  outletId={outletId}
                  emptyTableLabels={emptyLabels}
                />
              ))
            : zoneTables.map((table) => {
                const style = {
                  empty: { bg: "bg-slate-50", ring: "ring-slate-200", label: "Kosong" },
                  open: { bg: "bg-emerald-50", ring: "ring-emerald-300", label: "Terisi" },
                  held: { bg: "bg-amber-50", ring: "ring-amber-300", label: "Hold" },
                  partial: { bg: "bg-blue-50", ring: "ring-blue-300", label: "Partial bayar" }
                }[table.status];
                const href = table.orderId
                  ? `/pos/checkout/${table.orderId}?outlet=${outletId}`
                  : `/pos?outlet=${outletId}&table=${encodeURIComponent(table.label)}`;

                return (
                  <Link
                    key={table.id}
                    href={href}
                    className={`rounded-xl p-4 ring-2 transition hover:scale-[1.02] active:scale-[0.98] ${style.bg} ${style.ring}`}
                  >
                    <p className="text-lg font-black text-navy-900">Meja {table.label}</p>
                    <p className="text-xs text-slate-600">
                      {table.seats} kursi · {style.label}
                    </p>
                    {table.total != null && (
                      <p className="mt-2 text-sm font-bold text-navy-800">{formatRp(table.total)}</p>
                    )}
                    {(table.pendingKitchen ?? 0) > 0 && (
                      <p className="mt-1 text-xs font-semibold text-amber-700">
                        {table.pendingKitchen} belum dapur
                      </p>
                    )}
                  </Link>
                );
              }))}
        </div>
      </section>
    );
  });

  const headerActions = (
    <>
      <PosSubPageAction href={`/library/floor?outlet=${outletId}`} label="Kelola Meja" />
      <PosSubPageAction href={`/pos/merge?outlet=${outletId}`} label="Gabung Bill" />
    </>
  );

  const statsBlock =
    useV2 || useOps ? (
      <div className={`mb-6 space-y-4 ${useV2 ? "pos-panel p-4" : ""}`}>
        <FloorStats floor={floor} />
        <FloorLegend />
      </div>
    ) : (
      <div className="mb-4 flex flex-wrap gap-3 text-xs">
        {(["empty", "open", "held", "partial"] as const).map((key) => {
          const style = {
            empty: { bg: "bg-slate-50", ring: "ring-slate-200", label: "Kosong" },
            open: { bg: "bg-emerald-50", ring: "ring-emerald-300", label: "Terisi" },
            held: { bg: "bg-amber-50", ring: "ring-amber-300", label: "Hold" },
            partial: { bg: "bg-blue-50", ring: "ring-blue-300", label: "Partial bayar" }
          }[key];
          return (
            <span key={key} className="flex items-center gap-1.5">
              <span className={`h-3 w-3 rounded ring-2 ${style.bg} ${style.ring}`} />
              {style.label}
            </span>
          );
        })}
      </div>
    );

  if (useV2) {
    return (
      <PosSubPageShell
        outletId={outletId}
        outletName={outlet.name}
        shiftLabel={shift.shiftLabel}
        title="Denah Meja"
        subtitle="tap meja untuk order atau bayar"
        width="xl"
        actions={headerActions}
      >
        <PosSubPageAlerts
          error={searchParams.error}
          ok={searchParams.ok}
          table={searchParams.table}
        />
        {statsBlock}
        {zoneSections}
      </PosSubPageShell>
    );
  }

  if (useOps) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-6 pb-24">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`/pos?outlet=${outletId}`} className="text-xs font-bold text-navy-700">
              ← POS
            </Link>
            <h1 className="text-2xl font-black text-navy-900">Denah Meja · {outlet.name}</h1>
            <p className="text-sm text-slate-600">
              Shift {shift.shiftLabel} · tap meja untuk order atau bayar
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/library/floor?outlet=${outletId}`} className="btn-secondary px-4 py-2 text-sm">
              Kelola Meja
            </Link>
            <Link href={`/pos/merge?outlet=${outletId}`} className="btn-secondary px-4 py-2 text-sm">
              Gabung Bill
            </Link>
          </div>
        </header>
        <PosSubPageAlerts
          error={searchParams.error}
          ok={searchParams.ok}
          table={searchParams.table}
        />
        {statsBlock}
        {zoneSections}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 pb-24">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/pos?outlet=${outletId}`} className="text-xs font-bold text-navy-700">
            ← POS
          </Link>
          <h1 className="text-xl font-black text-navy-900">Denah Meja · {outlet.name}</h1>
          <p className="text-sm text-slate-600">Shift {shift.shiftLabel} · tap meja untuk order</p>
        </div>
        <Link href={`/library/floor?outlet=${outletId}`} className="btn-secondary px-4 py-2 text-sm">
          Kelola Meja
        </Link>
        <Link href={`/pos/merge?outlet=${outletId}`} className="btn-secondary px-4 py-2 text-sm">
          Gabung Bill
        </Link>
      </header>
      <PosSubPageAlerts
        error={searchParams.error}
        ok={searchParams.ok}
        table={searchParams.table}
      />
      {statsBlock}
      {zoneSections}
    </main>
  );
}
