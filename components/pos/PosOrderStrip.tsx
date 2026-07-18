import Link from "next/link";
import { formatRp } from "@/lib/finance";
import type { PosOrder } from "@/lib/pos-kds-roadmap";
import { countOrderPendingItems } from "@/lib/pos-service";
import { labelFor, orderStatusLabel, paymentStatusLabel } from "@/lib/ui-labels";
import { OpStatusBadge } from "@/components/ui/OpStatusBadge";
import { PrintButton, VoidButton } from "./PosReceiptActions";
import { holdOrderAction, sendToKitchenAction } from "@/app/pos-actions";
import { DraftButton } from "./PosActionButtons";

export function PosOrderStrip({
  outletId,
  openBills,
  openBillMode
}: {
  outletId: string;
  openBills: PosOrder[];
  openBillMode: boolean;
}) {
  if (!openBillMode || openBills.length === 0) {
    return (
      <div className="pos-order-strip shrink-0">
        <p className="text-xs text-slate-500">
          {openBillMode
            ? "Belum ada order aktif — tambah item dari katalog."
            : "Mode bayar langsung aktif."}
        </p>
      </div>
    );
  }

  return (
    <div className="pos-order-strip shrink-0">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-navy-700">
          Order Aktif
          <span className="ml-1.5 rounded-md bg-gold-100 px-1.5 py-0.5 text-gold-600">
            {openBills.length}
          </span>
        </p>
        <p className="text-[10px] font-semibold text-slate-400">Geser untuk lihat semua</p>
      </div>
      <div className="flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {openBills.map((o) => {
          const pending = countOrderPendingItems(o);
          return (
            <article key={o.id} className="pos-strip-card">
              <div className="pos-strip-card__accent" aria-hidden />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-900">
                    Meja {o.tableLabel ?? "—"}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500">{o.orderNumber}</p>
                </div>
                <OpStatusBadge tone={pending > 0 ? "progress" : "ready"}>
                  {labelFor(paymentStatusLabel, o.paymentStatus)}
                </OpStatusBadge>
              </div>
              <p className="relative mt-1.5 text-xs text-slate-600">
                <span className="font-semibold text-navy-800">{formatRp(o.total)}</span>
                <span className="mx-1 text-slate-300">·</span>
                {o.items.length} item
                {pending > 0 && (
                  <span className="ml-1 font-semibold text-amber-700">· {pending} dapur</span>
                )}
              </p>
              <div className="relative mt-2.5 flex flex-wrap items-center gap-1.5">
                <Link
                  href={`/pos/checkout/${o.id}?outlet=${outletId}`}
                  className="inline-flex flex-1 items-center justify-center rounded-lg bg-navy-800 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-navy-700"
                >
                  Bayar
                </Link>
                {pending > 0 && (
                  <form action={sendToKitchenAction}>
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="orderId" value={o.id} />
                    <button type="submit" className="btn-secondary px-2.5 py-2 text-[10px]">
                      Dapur
                    </button>
                  </form>
                )}
                <Link
                  href={`/pos/split/${o.id}?outlet=${outletId}`}
                  className="btn-secondary px-2.5 py-2 text-[10px]"
                >
                  Pisah
                </Link>
                <form action={holdOrderAction}>
                  <input type="hidden" name="outletId" value={outletId} />
                  <input type="hidden" name="orderId" value={o.id} />
                  <DraftButton />
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

export function PosShiftOrdersList({
  outletId,
  orders,
  sessionRole
}: {
  outletId: string;
  orders: PosOrder[];
  sessionRole: string;
}) {
  if (orders.length === 0) return null;

  return (
    <div className="pos-panel mt-3 p-4">
      <h3 className="mb-2 text-xs font-bold uppercase text-slate-500">Pesanan Shift Ini</h3>
      <ul className="space-y-2 text-sm">
        {orders.slice(0, 8).map((o) => {
          const canVoid = ["leader", "admin", "owner"].includes(sessionRole) && o.status === "completed";
          const canReprint = o.status === "completed";
          const statusTone =
            o.status === "void" ? "danger" : o.status === "merged" ? "muted" : "success";

          return (
            <li key={o.id} className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2">
              <div className="min-w-0">
                <p className="font-semibold text-navy-900">{o.orderNumber}</p>
                <p className="text-xs text-slate-500">{formatRp(o.total)}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <OpStatusBadge tone={statusTone}>
                  {labelFor(orderStatusLabel, o.status, o.status)}
                </OpStatusBadge>
                {canReprint && <PrintButton orderId={o.id} outletId={outletId} />}
                {canVoid && <VoidButton orderId={o.id} outletId={outletId} />}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
