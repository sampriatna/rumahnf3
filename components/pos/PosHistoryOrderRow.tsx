import Link from "next/link";
import { formatRp } from "@/lib/finance";
import type { PosOrder } from "@/lib/pos-kds-roadmap";
import { orderChannelLabel } from "@/lib/orders-service";
import { labelFor, orderStatusLabel, paymentStatusLabel } from "@/lib/ui-labels";
import { OpStatusBadge } from "@/components/ui/OpStatusBadge";

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

export function PosHistoryOrderRow({ order, outletId }: { order: PosOrder; outletId: string }) {
  const time = new Date(order.createdAt).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit"
  });
  const canPay =
    ["open", "held", "paid"].includes(order.status) && order.paymentStatus !== "paid";

  return (
    <li className="rounded-xl border border-slate-100 bg-white px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-black text-navy-900">{order.orderNumber}</p>
          <p className="text-xs text-slate-500">
            {time} · {orderChannelLabel(outletId, order)}
            {order.tableLabel ? ` · ${order.tableLabel}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-lg font-black text-navy-900">{formatRp(order.total)}</span>
          <div className="flex gap-1">
            <OpStatusBadge tone={paymentTone(order.paymentStatus)}>
              {labelFor(paymentStatusLabel, order.paymentStatus)}
            </OpStatusBadge>
            <OpStatusBadge tone={orderTone(order.status)}>
              {labelFor(orderStatusLabel, order.status, order.status)}
            </OpStatusBadge>
          </div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {canPay && (
          <Link
            href={`/pos/checkout/${order.id}?outlet=${outletId}`}
            className="text-xs font-bold text-navy-700 underline"
          >
            Bayar
          </Link>
        )}
        <Link
          href={`/pos/receipt/${order.id}?outlet=${outletId}`}
          className="text-xs font-bold text-slate-600 underline"
        >
          Struk
        </Link>
      </div>
    </li>
  );
}
