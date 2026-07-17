import { describe, expect, it, beforeEach } from "vitest";
import { store } from "./store";
import { ensurePosSeeded, openShift } from "./pos-service";
import { addOutletExpense } from "./pos-outlet-expense";
import {
  querySalesHistory,
  buildSalesRecap,
  formatPosDateLabel,
  toPosBusinessDate
} from "./pos-sales-history";

function seedOrder(outletId: string, shiftId: string, orderNumber: string, total: number) {
  const now = new Date().toISOString();
  store().posOrders.push({
    id: `ord-${orderNumber}`,
    outletId,
    shiftId,
    orderNumber,
    channel: "dine_in",
    status: "completed",
    paymentStatus: "paid",
    subtotal: total,
    discountAmount: 0,
    taxAmount: 0,
    serviceChargeAmount: 0,
    total,
    items: [],
    payments: [{ id: "p1", method: "cash", amount: total, status: "captured" }],
    createdBy: "Kasir",
    createdAt: now
  });
}

describe("pos-sales-history", () => {
  beforeEach(() => {
    ensurePosSeeded();
    const s = store();
    s.posOrders = [];
    s.posShifts = [];
    s.posCarts = {};
    s.posStoreDays = [];
  });

  it("lists orders for business date", () => {
    const opened = openShift({
      outletId: "kbu",
      registerId: "reg-kbu-1",
      shiftLabel: "Pagi",
      openingFloat: 100_000,
      openedBy: "u1",
      openedByName: "Kasir"
    });
    seedOrder("kbu", opened.shift!.id, "ORD-100", 50_000);

    const today = toPosBusinessDate(new Date().toISOString());
    const { orders } = querySalesHistory("kbu", { date: today });
    expect(orders.length).toBe(1);
    expect(orders[0].orderNumber).toBe("ORD-100");
  });

  it("filters by search query", () => {
    const opened = openShift({
      outletId: "kbu",
      registerId: "reg-kbu-1",
      shiftLabel: "Pagi",
      openingFloat: 100_000,
      openedBy: "u1",
      openedByName: "Kasir"
    });
    seedOrder("kbu", opened.shift!.id, "ORD-AAA", 10_000);
    seedOrder("kbu", opened.shift!.id, "ORD-BBB", 20_000);

    const today = toPosBusinessDate(new Date().toISOString());
    const { orders } = querySalesHistory("kbu", { date: today, q: "AAA" });
    expect(orders.length).toBe(1);
  });

  it("builds recap with expenses in range", () => {
    const opened = openShift({
      outletId: "kbu",
      registerId: "reg-kbu-1",
      shiftLabel: "Pagi",
      openingFloat: 100_000,
      openedBy: "u1",
      openedByName: "Kasir"
    });
    seedOrder("kbu", opened.shift!.id, "ORD-1", 100_000);
    addOutletExpense({
      shiftId: opened.shift!.id,
      category: "Operasional",
      amount: 25_000,
      note: "Es",
      createdBy: "Kasir"
    });

    const today = toPosBusinessDate(new Date().toISOString());
    const recap = buildSalesRecap("kbu", today, today)!;
    expect(recap.netSales).toBe(100_000);
    expect(recap.outletExpensesTotal).toBe(25_000);
    expect(recap.byPayment.cash).toBe(100_000);
  });

  it("formats date label DD-MM-YYYY", () => {
    expect(formatPosDateLabel("2026-07-15")).toBe("15-07-2026");
  });
});
