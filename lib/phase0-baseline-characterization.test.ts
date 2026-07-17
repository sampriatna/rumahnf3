import { beforeEach, describe, expect, it } from "vitest";
import {
  addCartToOpenBill,
  addPayment,
  addToCart,
  createOrderFromCart,
  getCart,
  getOrder,
  mergeOrders,
  moveOrderTable,
  openShift,
  splitOrder,
  ensurePosSeeded
} from "./pos-service";
import { fireKdsTicketsForOrder } from "./kds-service";
import { boardTicketIds, listBoard, prosesTicket, siapTicket } from "./kds-board-service";
import { store } from "./store";

function resetPosKdsState() {
  const s = store();
  s.posSeeded = false;
  s.kdsSeeded = false;
  s.kdsBoardSeeded = false;
  s.posOrders = [];
  s.posShifts = [];
  s.posStoreDays = [];
  s.posCarts = {};
  s.posOrderDaySeq = {};
  s.kdsTickets = [];
  s.kdsBoardTickets = [];
  s.kdsBoardServedToday = {};
}

function openKbuShift() {
  const res = openShift({
    outletId: "kbu",
    registerId: "reg-kbu-main",
    shiftLabel: "Pagi",
    openingFloat: 100000,
    openedBy: "u-kasir",
    openedByName: "Kasir KBU"
  });
  if ("error" in res && res.error) throw new Error(res.error);
  if (!res.shift) throw new Error("shift missing");
  return res.shift;
}

describe("phase0 baseline characterization", () => {
  beforeEach(() => {
    ensurePosSeeded();
    resetPosKdsState();
    ensurePosSeeded();
  });

  it("maintains dine-in open bill add-order and move-table behavior", () => {
    const shift = openKbuShift();
    addToCart(shift.id, "mi-nasi-goreng", 1);
    const first = addCartToOpenBill({
      shiftId: shift.id,
      outletId: "kbu",
      channel: "dine_in",
      tableLabel: "A1",
      createdBy: "Kasir KBU"
    });
    expect("error" in first).toBe(false);
    if (!first.order) throw new Error("order should exist");
    const orderId = first.order.id;
    expect(first.order.items.length).toBe(1);

    addToCart(shift.id, "mi-latte", 1);
    const second = addCartToOpenBill({
      shiftId: shift.id,
      outletId: "kbu",
      channel: "dine_in",
      tableLabel: "A1",
      createdBy: "Kasir KBU"
    });
    if (!second.order) throw new Error("order should exist");
    expect(second.order.id).toBe(orderId);
    expect(second.order.items.length).toBe(2);

    const moved = moveOrderTable({ orderId, newTableLabel: "A2" });
    expect("error" in moved).toBe(false);
    if (!moved.order) throw new Error("moved order should exist");
    expect(moved.order.tableLabel).toBe("A2");
  });

  it("maintains split and merge bill behavior for open orders", () => {
    const shift = openKbuShift();
    addToCart(shift.id, "mi-nasi-goreng", 1);
    addToCart(shift.id, "mi-latte", 1);
    const created = createOrderFromCart({
      shiftId: shift.id,
      outletId: "kbu",
      channel: "dine_in",
      tableLabel: "B1",
      createdBy: "Kasir KBU"
    })!;
    expect(created.items.length).toBe(2);

    const split = splitOrder({
      orderId: created.id,
      itemIds: [created.items[0].id],
      newTableLabel: "B2",
      createdBy: "Kasir KBU"
    });
    expect("error" in split).toBe(false);
    if (!split.source || !split.newOrder) throw new Error("split orders should exist");
    expect(split.source.items.length).toBe(1);
    expect(split.newOrder.items.length).toBe(1);
    expect(split.newOrder.status).toBe("open");

    const merged = mergeOrders({
      targetOrderId: split.source.id,
      sourceOrderIds: [split.newOrder.id]
    });
    expect("error" in merged).toBe(false);
    if (!merged.target) throw new Error("merged target should exist");
    expect(merged.target.items.length).toBe(2);
    const sourceAfterMerge = getOrder(split.newOrder.id)!;
    expect(sourceAfterMerge.status).toBe("merged");
  });

  it("maintains partial then full payment behavior", () => {
    const shift = openKbuShift();
    addToCart(shift.id, "mi-nasi-goreng", 1);
    const order = createOrderFromCart({
      shiftId: shift.id,
      outletId: "kbu",
      channel: "takeaway",
      createdBy: "Kasir KBU"
    })!;

    const p1 = addPayment({
      orderId: order.id,
      method: "cash",
      amount: 10000,
      createdBy: "Kasir KBU"
    })!;
    expect(p1.order.paymentStatus).toBe("partial");
    expect(p1.order.status).toBe("open");
    expect(p1.remaining).toBeGreaterThan(0);

    const p2 = addPayment({
      orderId: order.id,
      method: "cash",
      amount: 999999,
      createdBy: "Kasir KBU"
    })!;
    expect(p2.order.paymentStatus).toBe("paid");
    expect(p2.order.status).toBe("completed");
    expect(p2.remaining).toBe(0);
  });

  it("maintains send-to-kds and status sync to pos item behavior", () => {
    const shift = openKbuShift();
    addToCart(shift.id, "mi-nasi-goreng", 1);
    addToCart(shift.id, "mi-latte", 1);
    const order = createOrderFromCart({
      shiftId: shift.id,
      outletId: "kbu",
      channel: "dine_in",
      tableLabel: "C1",
      createdBy: "Kasir KBU"
    })!;

    const fired = fireKdsTicketsForOrder(order, { onlyPending: true });
    expect(fired.length).toBeGreaterThan(0);

    const dapurBoard = listBoard("kbu", "dapur");
    expect(dapurBoard.baru.length + dapurBoard.diproces.length + dapurBoard.siap.length).toBeGreaterThan(0);

    const dapurIds = boardTicketIds("kbu", "dapur");
    expect(dapurIds.length).toBeGreaterThan(0);
    const tId = dapurIds[0];
    prosesTicket(tId, "dapur", "Chef");
    siapTicket(tId, "dapur", "Chef");

    const updated = getOrder(order.id)!;
    expect(updated.items.some((it) => it.status === "cooking" || it.status === "ready")).toBe(true);
  });
});
