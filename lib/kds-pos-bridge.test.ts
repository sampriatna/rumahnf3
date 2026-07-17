import { describe, it, expect, beforeEach } from "vitest";
import type { PosOrder } from "./pos-kds-roadmap";
import { store } from "./store";
import { channelToKdsOrderType, buildTicketFromOrder, upsertBoardTicketFromOrder } from "./kds-pos-bridge";
import { ensurePosSeeded } from "./pos-service";

function sampleOrder(): PosOrder {
  return {
    id: "ord-test-1",
    outletId: "kbu",
    orderNumber: "KBU-TEST-1",
    channel: "dine_in",
    tableLabel: "Meja 8",
    status: "open",
    paymentStatus: "unpaid",
    subtotal: 50000,
    discountAmount: 0,
    taxAmount: 0,
    serviceChargeAmount: 0,
    total: 50000,
    createdAt: new Date().toISOString(),
    kitchenSentAt: new Date().toISOString(),
    items: [
      {
        id: "line-1",
        menuItemId: "mi-nasi-goreng",
        nameSnapshot: "Nasi Goreng KBU",
        qty: 1,
        unitPrice: 35000,
        modifiersSnapshot: [],
        lineTotal: 35000,
        status: "fired"
      },
      {
        id: "line-2",
        menuItemId: "mi-latte",
        nameSnapshot: "Latte",
        qty: 1,
        unitPrice: 28000,
        modifiersSnapshot: [{ name: "Less ice", priceDelta: 0 }],
        lineTotal: 28000,
        status: "fired"
      }
    ],
    payments: []
  };
}

describe("kds-pos-bridge", () => {
  beforeEach(() => {
    ensurePosSeeded();
    store().kdsBoardTickets = [];
    store().posOrders = [];
  });

  it("maps channel to order type", () => {
    expect(channelToKdsOrderType("dine_in")).toBe("dine_in");
    expect(channelToKdsOrderType("gofood")).toBe("ojol");
    expect(channelToKdsOrderType("delivery_own")).toBe("delivery_wa");
  });

  it("builds ticket from POS order with multi-station items", () => {
    const ticket = buildTicketFromOrder(sampleOrder());
    expect(ticket).not.toBeNull();
    expect(ticket!.orderType).toBe("dine_in");
    expect(ticket!.tableNumber).toBe("8");
    expect(ticket!.items).toHaveLength(2);
    expect(ticket!.items.some((i) => i.station === "dapur")).toBe(true);
    expect(ticket!.items.some((i) => i.station === "bar")).toBe(true);
  });

  it("upserts into kdsBoardTickets", () => {
    store().posOrders.push(sampleOrder());
    upsertBoardTicketFromOrder(sampleOrder());
    expect(store().kdsBoardTickets).toHaveLength(1);
    expect(store().kdsBoardTickets[0].orderId).toBe("ord-test-1");
  });
});
