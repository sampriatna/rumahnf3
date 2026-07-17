import { describe, expect, it } from "vitest";
import { filterShiftOrders } from "./orders-service";
import type { PosOrder } from "./pos-kds-roadmap";

function sampleOrder(overrides: Partial<PosOrder> = {}): PosOrder {
  return {
    id: "O1",
    outletId: "kbu",
    shiftId: "S1",
    orderNumber: "KBU-001",
    channel: "dine_in",
    status: "open",
    paymentStatus: "unpaid",
    subtotal: 100_000,
    discountAmount: 0,
    taxAmount: 0,
    serviceChargeAmount: 0,
    total: 100_000,
    createdAt: new Date().toISOString(),
    items: [],
    payments: [],
    ...overrides
  };
}

describe("filterShiftOrders", () => {
  const orders = [
    sampleOrder({ id: "1", channel: "dine_in", paymentStatus: "unpaid", status: "open" }),
    sampleOrder({ id: "2", channel: "takeaway", paymentStatus: "paid", status: "completed" }),
    sampleOrder({ id: "3", channel: "dine_in", paymentStatus: "partial", status: "open" })
  ];

  it("filters by channel", () => {
    const result = filterShiftOrders(orders, { channel: "takeaway" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters active orders", () => {
    const result = filterShiftOrders(orders, { status: "active" });
    expect(result.map((o) => o.id)).toEqual(["1", "3"]);
  });

  it("filters by payment status", () => {
    const result = filterShiftOrders(orders, { payment: "paid" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });
});
