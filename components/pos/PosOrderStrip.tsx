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
      <div className="shrink-0 border-b border-slate-100 bg-slate-50/80 px-4 py-2">
        <p className="text-xs text-slate-500">
          {openBillMode ? "Belum ada bill terbuka — tambah item dari katalog." : "Mode bayar langsung aktif."}
        </p>
      </div>
    );
  }

  return (
    <div className="shrink-0 border-b border-slate-200 bg-slate-50 px-4 py-2">
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        Bill Terbuka ({openBills.length})
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
        {openBills.map((o) => {
          const pending = countOrderPendingItems(o);
          return (
            <article key={o.id} className="pos-strip-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-navy-900">
                    Meja {o.tableLabel ?? "—"}
                  </p>
                  <p className="text-[11px] text-slate-500">{o.orderNumber}</p>
                </div>
                <OpStatusBadge tone={pending > 0 ? "progress" : "ready"}>
                  {labelFor(paymentStatusLabel, o.paymentStatus)}
                </OpStatusBadge>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {o.items.length} item · {formatRp(o.total)}
                {pending > 0 && (
                  <span className="ml-1 font-semibold text-amber-700">· {pending} belum dapur</span>
                )}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {pending > 0 && (
                  <form action={sendToKitchenAction}>
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="orderId" value={o.id} />
                    <button type="submit" className="btn-secondary px-2 py-1 text-[10px]">
                      Dapur
                    </button>
                  </form>
                )}
                <Link
                  href={`/pos/checkout/${o.id}?outlet=${outletId}`}
                  className="btn-primary px-2 py-1 text-[10px]"
                >
                  Bayar
                </Link>
                <Link
                  href={`/pos/split/${o.id}?outlet=${outletId}`}
                  className="btn-secondary px-2 py-1 text-[10px]"
                >
                  Split
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
