import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { getOrder } from "@/lib/pos-service";
import { splitOrderAction } from "../../../pos-actions";
import { requirePosSession } from "@/lib/pos-auth";
import { UI_FLAGS } from "@/lib/ui-flags";
import { PosSubPageShell } from "@/components/pos/PosSubPageShell";
import { PosSubPageAlerts } from "@/components/pos/PosSubPageAlerts";

export default function PosSplitPage({
  params,
  searchParams
}: {
  params: { orderId: string };
  searchParams: { outlet?: string; error?: string };
}) {
  const session = requirePosSession();
  const order = getOrder(params.orderId);
  if (!order) redirect("/pos");

  const outletId = searchParams.outlet ?? order.outletId ?? session.outletId;
  const outlet = OUTLETS.find((o) => o.id === outletId);
  const useV2 = UI_FLAGS.posLayoutV2;

  if (order.status !== "open" || order.paymentStatus === "partial") {
    redirect(`/pos?outlet=${outletId}&error=${encodeURIComponent("Bill tidak bisa di-split.")}`);
  }

  const formBody = (
    <>
      <p className="text-sm text-slate-600">
        {order.orderNumber} · Meja {order.tableLabel ?? "—"}
      </p>
      <p className="mt-4 text-sm text-slate-600">
        Centang item yang dipindah ke bill baru. Bill asal harus menyisakan minimal 1 item.
      </p>
      <form action={splitOrderAction} className="mt-4">
        <input type="hidden" name="outletId" value={outletId} />
        <input type="hidden" name="orderId" value={order.id} />
        <ul className="mb-4 space-y-2 border-y border-slate-100 py-4">
          {order.items.map((it) => (
            <li key={it.id}>
              <label className="pos-cart-line cursor-pointer">
                <input type="checkbox" name="itemId" value={it.id} className="mt-1 rounded" />
                <span className="flex-1 text-sm">
                  <span className="font-semibold text-navy-900">
                    {it.qty}× {it.nameSnapshot}
                  </span>
                  <span className="ml-2 text-slate-600">{formatRp(it.lineTotal)}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
        <div className="mb-4">
          <label htmlFor="newTableLabel" className="nf3-field-label">
            Label bill baru
          </label>
          <input
            id="newTableLabel"
            name="newTableLabel"
            type="text"
            required
            defaultValue={order.tableLabel ? `${order.tableLabel}B` : "Split"}
            className="nf3-input mt-1 py-3 text-base font-semibold"
          />
        </div>
        <button type="submit" className={useV2 ? "pos-cta-primary" : "btn-primary w-full py-4 text-base"}>
          Split ke Bill Baru
        </button>
      </form>
    </>
  );

  if (useV2 && outlet) {
    return (
      <PosSubPageShell
        outletId={outletId!}
        outletName={outlet.name}
        shiftLabel="aktif"
        title="Split Bill"
        width="md"
      >
        <PosSubPageAlerts error={searchParams.error} />
        <div className="pos-panel p-6">{formBody}</div>
      </PosSubPageShell>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <Link href={`/pos?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
        ← POS
      </Link>
      <div className="mt-4 panel p-6">
        <h1 className="text-xl font-black text-navy-900">Split Bill</h1>
        <PosSubPageAlerts error={searchParams.error} />
        {formBody}
      </div>
    </main>
  );
}
