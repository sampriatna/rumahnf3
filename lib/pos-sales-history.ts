import { ensurePosSeeded } from "./pos-service";
import { store } from "./store";
import { getPosBusinessDate } from "./pos-store-day";
import { sumOutletExpenses } from "./pos-outlet-expense";
import type { PosOrder, PosOrderStatus, PosPaymentStatus } from "./pos-kds-roadmap";

export type SalesHistoryFilter = {
  date?: string;
  q?: string;
  status?: PosOrderStatus | "all" | "active";
  payment?: PosPaymentStatus | "all";
};

export type SalesRecapResult = {
  fromDate: string;
  toDate: string;
  transactionCount: number;
  completedCount: number;
  grossSales: number;
  netSales: number;
  totalDiscount: number;
  outletExpensesTotal: number;
  voidCount: number;
  shiftCount: number;
  byPayment: Record<string, number>;
  byChannel: Record<string, number>;
};

/** ISO → tanggal bisnis YYYY-MM-DD (WIB). */
export function toPosBusinessDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

export function formatPosDateLabel(ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return ymd;
  return `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${y}`;
}

export function parseYmdDate(raw?: string | null): string | undefined {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return undefined;
  const d = new Date(`${raw}T12:00:00+07:00`);
  if (Number.isNaN(d.getTime())) return undefined;
  return raw;
}

export function defaultRecapRange(): { from: string; to: string } {
  const to = getPosBusinessDate();
  const [y, m] = to.split("-").map(Number);
  const from = `${y}-${String(m).padStart(2, "0")}-01`;
  return { from, to };
}

function orderOnBusinessDate(order: PosOrder, ymd: string): boolean {
  return toPosBusinessDate(order.createdAt) === ymd;
}

function orderInRange(order: PosOrder, from: string, to: string): boolean {
  const d = toPosBusinessDate(order.createdAt);
  return d >= from && d <= to;
}

/** Semua order outlet (termasuk shift tertutup). */
export function listOutletOrders(outletId: string): PosOrder[] {
  ensurePosSeeded();
  return store()
    .posOrders.filter((o) => o.outletId === outletId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function listOutletOrdersByDate(outletId: string, dateYmd: string): PosOrder[] {
  return listOutletOrders(outletId).filter((o) => orderOnBusinessDate(o, dateYmd));
}

export function filterSalesHistory(orders: PosOrder[], filter: SalesHistoryFilter): PosOrder[] {
  const q = filter.q?.trim().toLowerCase();
  return orders.filter((o) => {
    if (filter.status === "active") {
      if (!["open", "held", "paid"].includes(o.status)) return false;
    } else if (filter.status && filter.status !== "all" && o.status !== filter.status) {
      return false;
    }
    if (filter.payment && filter.payment !== "all" && o.paymentStatus !== filter.payment) {
      return false;
    }
    if (q) {
      const hay = [
        o.orderNumber,
        o.tableLabel,
        o.customerName,
        o.id
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function querySalesHistory(
  outletId: string,
  filter: SalesHistoryFilter
): { date: string; orders: PosOrder[] } {
  const date = parseYmdDate(filter.date) ?? getPosBusinessDate();
  const base = listOutletOrdersByDate(outletId, date);
  const orders = filterSalesHistory(base, filter);
  return { date, orders };
}

function shiftsInRange(outletId: string, from: string, to: string) {
  ensurePosSeeded();
  return store().posShifts.filter((s) => {
    if (s.outletId !== outletId) return false;
    const d = toPosBusinessDate(s.openedAt);
    return d >= from && d <= to;
  });
}

export function buildSalesRecap(
  outletId: string,
  fromRaw?: string | null,
  toRaw?: string | null
): SalesRecapResult | null {
  ensurePosSeeded();
  const defaults = defaultRecapRange();
  const fromDate = parseYmdDate(fromRaw) ?? defaults.from;
  const toDate = parseYmdDate(toRaw) ?? defaults.to;
  if (fromDate > toDate) return null;

  const orders = listOutletOrders(outletId).filter((o) => orderInRange(o, fromDate, toDate));
  const completed = orders.filter((o) => o.status === "completed");

  const byPayment: Record<string, number> = {};
  const byChannel: Record<string, number> = {};

  for (const o of completed) {
    byChannel[o.channel] = (byChannel[o.channel] ?? 0) + o.total;
    for (const p of o.payments.filter((x) => x.status === "captured")) {
      byPayment[p.method] = (byPayment[p.method] ?? 0) + p.amount;
    }
  }

  const shifts = shiftsInRange(outletId, fromDate, toDate);
  const outletExpensesTotal = shifts.reduce((s, sh) => s + sumOutletExpenses(sh.id), 0);

  return {
    fromDate,
    toDate,
    transactionCount: orders.length,
    completedCount: completed.length,
    grossSales: completed.reduce((s, o) => s + o.subtotal, 0),
    netSales: completed.reduce((s, o) => s + o.total, 0),
    totalDiscount: completed.reduce((s, o) => s + o.discountAmount, 0),
    outletExpensesTotal,
    voidCount: orders.filter((o) => o.status === "void").length,
    shiftCount: shifts.length,
    byPayment,
    byChannel
  };
}
