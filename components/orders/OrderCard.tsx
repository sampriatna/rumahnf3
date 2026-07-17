import Link from "next/link";
import { formatRp } from "@/lib/finance";
import type { PosOrder } from "@/lib/pos-kds-roadmap";
import { orderChannelLabel } from "@/lib/orders-service";
import { labelFor, orderStatusLabel, paymentStatusLabel, productionStatusLabel } from "@/lib/ui-labels";
import { OpStatusBadge } from "@/components/ui/OpStatusBadge";
import { OrderItemRow } from "./OrderItemRow";

function paymentTone(status: string): "progress" | "ready" | "success" | "muted" {
  if (status === "unpaid") return "progress";
  if (status === "partial") return "ready";
  if (status === "paid") return "success";
  return "muted";
}

function orderTone(status: string): "progress" | "ready" | "success" | "danger" | "muted" {
  if (status === "open" || status === "held") return "progress";
  if (status === "paid") return "ready";
  if (status === "completed") return "success";
  if (status === "void") return "danger";
  return "muted";
}

export function OrderCard({ order, outletId }: { order: PosOrder; outletId: string }) {
  const pendingKitchen = order.items.filter((i) => i.status === "pending").length;
  const canPay = ["open", "held", "paid"].includes(order.status) && order.paymentStatus !== "paid";

  return (
    <article className="panel flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-black text-navy-900">{order.orderNumber}</p>
          <p className="text-sm text-slate-600">
            {orderChannelLabel(outletId, order)}
            {order.tableLabel ? ` · ${order.tableLabel}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <OpStatusBadge tone={paymentTone(order.paymentStatus)}>
            {labelFor(paymentStatusLabel, order.paymentStatus)}
          </OpStatusBadge>
          <OpStatusBadge tone={orderTone(order.status)}>
            {labelFor(orderStatusLabel, order.status, order.status)}
          </OpStatusBadge>
        </div>
      </div>

      <p className="mt-2 text-xl font-black text-navy-900">{formatRp(order.total)}</p>
      <p className="text-xs text-slate-500">
        {order.items.length} item
        {pendingKitchen > 0 && (
          <span className="ml-1 font-semibold text-amber-700">· {pendingKitchen} belum dapur</span>
        )}
      </p>

      <ul className="mt-3 max-h-40 space-y-1 overflow-y-auto border-t border-slate-100 pt-3">
        {order.items.slice(0, 6).map((item) => (
          <OrderItemRow
            key={item.id}
            name={item.nameSnapshot}
            qty={item.qty}
            statusLabel={labelFor(productionStatusLabel, item.status, item.status)}
            tone={
              item.status === "ready" || item.status === "served"
                ? "ready"
                : item.status === "pending"
                  ? "progress"
                  : "active"
            }
          />
        ))}
        {order.items.length > 6 && (
          <li className="text-xs text-slate-400">+{order.items.length - 6} item lainnya</li>
        )}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {canPay && (
          <Link href={`/pos/checkout/${order.id}?outlet=${outletId}`} className="btn-primary px-3 py-2 text-xs">
            Bayar
          </Link>
        )}
        <Link href={`/pos?outlet=${outletId}&order=${order.id}`} className="btn-secondary px-3 py-2 text-xs">
          Buka di POS
        </Link>
      </div>
    </article>
  );
}
