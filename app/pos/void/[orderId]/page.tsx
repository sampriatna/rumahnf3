import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { getOrder } from "@/lib/pos-service";
import { listCancelReasons, ensureCancelReasonsReady } from "@/lib/cancel-reason-service";
import { getCustomer } from "@/lib/loyalty-service";
import { voidOrderAction } from "../../../pos-actions";
import { requirePosSession } from "@/lib/pos-auth";
import { UI_FLAGS } from "@/lib/ui-flags";
import { PosSubPageShell } from "@/components/pos/PosSubPageShell";
import { PosSubPageAlerts } from "@/components/pos/PosSubPageAlerts";
import { PosCancelReasonFields } from "@/components/pos/PosCancelReasonFields";

const VOID_ROLES = ["leader", "admin", "owner"];

export default function PosVoidPage({
  params,
  searchParams
}: {
  params: { orderId: string };
  searchParams: { outlet?: string; error?: string };
}) {
  const session = requirePosSession();
  if (!VOID_ROLES.includes(session.role)) redirect("/pos");

  const order = getOrder(params.orderId);
  if (!order) redirect("/pos");

  const outletId = searchParams.outlet ?? order.outletId ?? session.outletId;
  const outlet = OUTLETS.find((o) => o.id === outletId);
  const member = order.customerId ? getCustomer(order.customerId) : undefined;

  if (outletId) ensureCancelReasonsReady(outletId);
  const voidReasons = outletId ? listCancelReasons(outletId, "order") : [];
  const useV2 = UI_FLAGS.posLayoutV2;

  const panel = (
    <div className={useV2 ? "pos-panel p-6" : "panel p-6"}>
      <h1 className="text-xl font-black text-rose-700">Void / Refund Order</h1>
      <p className="text-sm text-slate-600">
        {order.orderNumber} · {outlet?.name} · {formatRp(order.total)}
      </p>
      {order.status === "void" ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Order ini sudah di-void {order.voidedAt && `(${new Date(order.voidedAt).toLocaleString("id-ID")})`}.
          Alasan: {order.voidReason}.
        </div>
      ) : order.status !== "completed" ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Hanya order yang sudah lunas bisa di-void.
        </div>
      ) : (
        <>
          <ul className="my-4 space-y-1 border-y border-slate-100 py-3 text-sm">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <span>
                  {it.qty}× {it.nameSnapshot}
                </span>
                <span>{it.isRewardItem ? "GRATIS" : formatRp(it.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-800">
            <p className="font-bold">Efek void:</p>
            <ul className="mt-1 list-disc pl-4">
              <li>Kas dikembalikan via ledger — status pembayaran menjadi Dikembalikan</li>
              {member ? (
                <li>
                  Loyalty {member.fullName}: koreksi poin/stamp/voucher otomatis
                </li>
              ) : (
                <li>Order tanpa member — tidak ada efek loyalty</li>
              )}
              <li>Stok hanya dikembalikan bila centang &quot;barang belum dibuat&quot;</li>
            </ul>
          </div>
          <form action={voidOrderAction} className="grid gap-3">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="orderId" value={order.id} />
            <PosCancelReasonFields
              reasons={voidReasons}
              notePlaceholder="Catatan tambahan untuk audit (opsional)"
            />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" name="restock" className="h-4 w-4" />
              Barang belum dibuat — kembalikan stok ke inventory
            </label>
            <button
              type="submit"
              className="w-full rounded-xl bg-rose-600 py-3 text-base font-bold text-white transition hover:bg-rose-700"
            >
              Void Order Ini
            </button>
          </form>
        </>
      )}
    </div>
  );

  if (useV2 && outlet) {
    return (
      <PosSubPageShell
        outletId={outletId!}
        outletName={outlet.name}
        shiftLabel="aktif"
        title="Void / Refund"
        width="md"
      >
        <PosSubPageAlerts error={searchParams.error} />
        {panel}
      </PosSubPageShell>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-8">
      <Link href={`/pos?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
        ← Kembali ke POS
      </Link>
      {searchParams.error && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {searchParams.error}
        </div>
      )}
      <div className="mt-4">{panel}</div>
    </main>
  );
}
