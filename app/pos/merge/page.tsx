import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { isPosOutlet } from "@/lib/pos-seed";
import { getPosOutletConfig } from "@/lib/pos-outlet-config";
import { getOpenShift, listOpenBills } from "@/lib/pos-service";
import { mergeOrdersAction } from "../../pos-actions";
import { requirePosSession } from "@/lib/pos-auth";
import { UI_FLAGS } from "@/lib/ui-flags";
import { PosSubPageShell } from "@/components/pos/PosSubPageShell";
import { PosSubPageAlerts } from "@/components/pos/PosSubPageAlerts";

export default function PosMergePage({
  searchParams
}: {
  searchParams: { outlet?: string; error?: string };
}) {
  const session = requirePosSession();

  const outletId =
    searchParams.outlet && (session.role === "owner" || session.role === "admin")
      ? searchParams.outlet
      : session.outletId ?? searchParams.outlet;

  if (!outletId || !isPosOutlet(outletId)) redirect("/pos");

  const cfg = getPosOutletConfig(outletId);
  if (!cfg.openBillMode) {
    redirect(`/pos?outlet=${outletId}&error=${encodeURIComponent("Merge hanya untuk outlet dine-in.")}`);
  }

  const shift = getOpenShift(outletId);
  if (!shift) redirect(`/pos?outlet=${outletId}`);

  const outlet = OUTLETS.find((o) => o.id === outletId)!;
  const openBills = listOpenBills(shift.id);
  const useV2 = UI_FLAGS.posLayoutV2;

  if (openBills.length < 2) {
    const empty = (
      <div className={`text-sm text-slate-600 ${useV2 ? "pos-panel p-6" : "panel p-6"}`}>
        Butuh minimal <strong>2 bill terbuka</strong> untuk digabung. Saat ini: {openBills.length}.
      </div>
    );
    if (useV2) {
      return (
        <PosSubPageShell
          outletId={outletId}
          outletName={outlet.name}
          shiftLabel={shift.shiftLabel}
          title="Gabung Bill"
          width="md"
        >
          {empty}
        </PosSubPageShell>
      );
    }
    return (
      <main className="mx-auto max-w-lg px-5 py-8">
        <Link href={`/pos?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
          ← POS
        </Link>
        <div className="mt-4">{empty}</div>
      </main>
    );
  }

  const formBody = (
    <>
      <p className="text-sm text-slate-600">
        Pilih bill <strong>target</strong> (tetap), lalu centang bill lain yang digabung ke target.
      </p>
      <form action={mergeOrdersAction} className="mt-4">
        <input type="hidden" name="outletId" value={outletId} />
        <p className="mb-2 text-xs font-bold uppercase text-slate-500">Bill target</p>
        <select
          name="targetOrderId"
          defaultValue={openBills[0]!.id}
          className="nf3-select mb-4 w-full py-3 text-sm font-semibold"
        >
          {openBills.map((o) => (
            <option key={o.id} value={o.id}>
              Meja {o.tableLabel} · {o.orderNumber} · {formatRp(o.total)}
            </option>
          ))}
        </select>
        <p className="mb-2 text-xs font-bold uppercase text-slate-500">Bill yang digabung</p>
        <ul className="mb-6 space-y-2">
          {openBills.map((o) => (
            <li key={o.id}>
              <label className="pos-cart-line cursor-pointer hover:border-gold-400/40">
                <input type="checkbox" name="sourceOrderId" value={o.id} className="rounded" />
                <span className="text-sm">
                  <span className="font-semibold text-navy-900">Meja {o.tableLabel}</span>
                  <span className="ml-2 text-slate-600">
                    {o.orderNumber} · {o.items.length} item · {formatRp(o.total)}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <button type="submit" className={useV2 ? "pos-cta-primary" : "btn-primary w-full py-4 text-base"}>
          Gabung Bill
        </button>
      </form>
    </>
  );

  if (useV2) {
    return (
      <PosSubPageShell
        outletId={outletId}
        outletName={outlet.name}
        shiftLabel={shift.shiftLabel}
        title="Gabung Bill"
        subtitle="gabungkan bill terbuka ke satu meja"
        width="md"
      >
        <PosSubPageAlerts error={searchParams.error} />
        <div className="pos-panel p-6">
          {formBody}
        </div>
      </PosSubPageShell>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <Link href={`/pos/floor?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
        ← Denah Meja
      </Link>
      <div className="mt-4 panel p-6">
        <h1 className="text-xl font-black text-navy-900">Gabung Bill</h1>
        <p className="text-sm text-slate-600">{outlet.name} · Shift {shift.shiftLabel}</p>
        <PosSubPageAlerts error={searchParams.error} />
        {formBody}
      </div>
    </main>
  );
}
