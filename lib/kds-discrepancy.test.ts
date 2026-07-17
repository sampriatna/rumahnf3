import { afterEach, describe, expect, it, vi } from "vitest";
import type { PosOrder } from "./pos-kds-roadmap";

const baseEnv = { ...process.env };

function resetPosKdsState(storeFn: typeof import("./store").store) {
  const s = storeFn();
  s.posSeeded = false;
  s.kdsSeeded = false;
  s.kdsBoardSeeded = false;
  s.posOrders = [];
  s.kdsTickets = [];
  s.kdsBoardTickets = [];
  s.kdsBoardServedToday = {};
}

function sampleOrder(): PosOrder {
  return {
    id: "ord-disc-1",
    outletId: "kbu",
    orderNumber: "KBU-DISC-1",
    channel: "dine_in",
    tableLabel: "Meja 1",
    status: "open",
    paymentStatus: "unpaid",
    subtotal: 35000,
    discountAmount: 0,
    taxAmount: 0,
    serviceChargeAmount: 0,
    total: 35000,
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "line-disc-1",
        menuItemId: "mi-nasi-goreng",
        nameSnapshot: "Nasi Goreng KBU",
        qty: 1,
        unitPrice: 35000,
        modifiersSnapshot: [],
        lineTotal: 35000,
        status: "pending"
      }
    ],
    payments: []
  };
}

describe("kds discrepancy audit", () => {
  afterEach(() => {
    process.env = { ...baseEnv };
  });

  it("detects board vs POS status mismatch", async () => {
    vi.resetModules();
    process.env.NF3_FF_KDS_CANONICAL_BOARD_WRITER = "true";
    const { ensurePosSeeded } = await import("./pos-service");
    const { fireKdsTicketsForOrder } = await import("./kds-service");
    const { detectKdsDiscrepanciesForOrder } = await import("./kds-discrepancy");
    const { store } = await import("./store");
    resetPosKdsState(store);
    ensurePosSeeded();

    const order = sampleOrder();
    store().posOrders.push(order);
    fireKdsTicketsForOrder(order, { onlyPending: true });

    const ticket = store().kdsBoardTickets.find((t) => t.orderId === order.id);
    expect(ticket).toBeTruthy();
    if (ticket) {
      ticket.items[0].status = "diproces";
      order.items[0].status = "fired";
    }

    const discrepancies = detectKdsDiscrepanciesForOrder(order.id);
    expect(discrepancies.length).toBe(1);
    expect(discrepancies[0]).toMatchObject({
      orderId: order.id,
      boardStatus: "diproces",
      posStatus: "fired"
    });
  });

  it("returns no discrepancy after board proses syncs POS", async () => {
    vi.resetModules();
    process.env.NF3_FF_KDS_CANONICAL_BOARD_WRITER = "true";
    const { ensurePosSeeded } = await import("./pos-service");
    const { fireKdsTicketsForOrder } = await import("./kds-service");
    const { prosesTicket, boardTicketIds } = await import("./kds-board-service");
    const { detectKdsDiscrepanciesForOrder } = await import("./kds-discrepancy");
    const { store } = await import("./store");
    resetPosKdsState(store);
    ensurePosSeeded();

    const order = sampleOrder();
    store().posOrders.push(order);
    fireKdsTicketsForOrder(order, { onlyPending: true });

    const ticketIds = boardTicketIds("kbu", "dapur");
    expect(ticketIds.length).toBeGreaterThan(0);
    const processed = prosesTicket(ticketIds[0], "dapur", "Chef");
    expect(processed).not.toBeNull();

    const discrepancies = detectKdsDiscrepanciesForOrder(order.id);
    expect(discrepancies).toHaveLength(0);
    const synced = store().posOrders.find((o) => o.id === order.id)!;
    expect(synced.items[0].status).toBe("cooking");
  });

  it("audit is disabled when canonical flag off", async () => {
    vi.resetModules();
    process.env.NF3_FF_KDS_CANONICAL_BOARD_WRITER = "false";
    const { auditKdsDiscrepancies } = await import("./kds-discrepancy");
    const report = auditKdsDiscrepancies("kbu");
    expect(report.enabled).toBe(false);
  });
});
