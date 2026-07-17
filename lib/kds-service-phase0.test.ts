import { afterEach, describe, expect, it, vi } from "vitest";
import type { PosOrder } from "./pos-kds-roadmap";

const baseEnv = { ...process.env };

function sampleOrder(): PosOrder {
  return {
    id: "ord-kds-phase0",
    outletId: "kbu",
    orderNumber: "KBU-TEST-KDS-1",
    channel: "dine_in",
    tableLabel: "Meja 2",
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
        id: "line-kds-1",
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

async function loadSubject() {
  vi.resetModules();
  const [{ fireKdsTicketsForOrder }, { store }] = await Promise.all([
    import("./kds-service"),
    import("./store")
  ]);
  return { fireKdsTicketsForOrder, store };
}

describe("kds-service phase0 feature flags", () => {
  afterEach(() => {
    process.env = { ...baseEnv };
  });

  it("uses board as canonical writer when legacy dual-write disabled", async () => {
    process.env.NF3_FF_KDS_CANONICAL_BOARD_WRITER = "true";
    process.env.NF3_FF_DUAL_WRITE_ENABLED = "false";

    const { fireKdsTicketsForOrder, store } = await loadSubject();
    const order = sampleOrder();

    const created = fireKdsTicketsForOrder(order, { onlyPending: true });

    expect(created.length).toBe(1);
    expect(store().kdsTickets.length).toBe(0);
    expect(store().kdsBoardTickets.some((t) => t.orderId === order.id)).toBe(true);
    expect(order.items[0].status).toBe("fired");
  });

  it("keeps legacy tickets when dual-write is enabled for kds", async () => {
    process.env.NF3_FF_KDS_CANONICAL_BOARD_WRITER = "true";
    process.env.NF3_FF_DUAL_WRITE_ENABLED = "true";
    process.env.NF3_FF_DUAL_WRITE_DOMAINS = "kds";

    const { fireKdsTicketsForOrder, store } = await loadSubject();
    const order = sampleOrder();

    const created = fireKdsTicketsForOrder(order, { onlyPending: true });

    expect(created.length).toBe(1);
    expect(store().kdsTickets.length).toBe(1);
    expect(store().kdsBoardTickets.some((t) => t.orderId === order.id)).toBe(true);
  });

  it("blocks legacy advanceTicket when canonical writer is on without dual-write", async () => {
    vi.resetModules();
    process.env.NF3_FF_KDS_CANONICAL_BOARD_WRITER = "true";
    process.env.NF3_FF_DUAL_WRITE_ENABLED = "false";

    const { fireKdsTicketsForOrder, advanceTicket } = await import("./kds-service");
    const { ensurePosSeeded } = await import("./pos-service");
    const { store } = await import("./store");
    ensurePosSeeded();
    const order = sampleOrder();
    store().kdsTickets = [];
    store().kdsBoardTickets = [];
    store().posOrders = [order];

    fireKdsTicketsForOrder(order, { onlyPending: true });
    expect(store().kdsTickets.length).toBe(0);

    store().kdsTickets.push({
      id: "legacy-1",
      orderId: order.id,
      orderItemId: order.items[0].id,
      outletId: order.outletId,
      areaId: "dapur",
      ticketNumber: 1,
      status: "new",
      priority: 0,
      firedAt: new Date().toISOString(),
      itemName: order.items[0].nameSnapshot,
      qty: 1,
      channel: order.channel,
      orderNumber: order.orderNumber
    });

    const result = advanceTicket("legacy-1", "Chef");
    expect(result).toBeNull();
  });
});
