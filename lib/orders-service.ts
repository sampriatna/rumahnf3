import type { PosOrder, PosOrderStatus, PosPaymentStatus } from "./pos-kds-roadmap";
import { getOpenShift, listShiftOrders } from "./pos-service";
import { channelDisplayName } from "./channel-service";

export type OrderListFilter = {
  channel?: string;
  payment?: PosPaymentStatus | "all";
  status?: PosOrderStatus | "active" | "all";
};

const HIDDEN_STATUSES = new Set<PosOrderStatus>(["void", "merged"]);

/** Pesanan shift terbuka untuk outlet — read-only. */
export function listOutletShiftOrders(outletId: string): PosOrder[] {
  const shift = getOpenShift(outletId);
  if (!shift) return [];
  return listShiftOrders(shift.id)
    .filter((o) => o.outletId === outletId && !HIDDEN_STATUSES.has(o.status))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function filterShiftOrders(orders: PosOrder[], filter: OrderListFilter): PosOrder[] {
  return orders.filter((o) => {
    if (filter.channel && filter.channel !== "all" && o.channel !== filter.channel) return false;
    if (filter.payment && filter.payment !== "all" && o.paymentStatus !== filter.payment) return false;
    if (filter.status === "active") {
      return ["open", "held", "paid"].includes(o.status);
    }
    if (filter.status && filter.status !== "all" && o.status !== filter.status) return false;
    return true;
  });
}

export function orderChannelLabel(outletId: string, order: PosOrder): string {
  return channelDisplayName(outletId, order.channel);
}

export function countOrdersByPayment(orders: PosOrder[]) {
  return {
    unpaid: orders.filter((o) => o.paymentStatus === "unpaid").length,
    partial: orders.filter((o) => o.paymentStatus === "partial").length,
    paid: orders.filter((o) => o.paymentStatus === "paid").length
  };
}
