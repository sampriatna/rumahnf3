import { describe, expect, it, beforeEach, vi } from "vitest";
import { store } from "./store";
import {
  ensurePosSeeded,
  createOrderFromCart,
  openShift,
  addToCart
} from "./pos-service";
import {
  getPendingSyncCount,
  getSyncCategorySummary,
  processPosSyncQueue,
  touchOrderSync
} from "./pos-sync-queue";

vi.mock("./cloud-persist", () => ({
  cloudSave: vi.fn(async () => undefined),
  cloudSavePos: vi.fn(async () => undefined),
  cloudLoad: vi.fn(async () => null),
  cloudLoadPos: vi.fn(async () => null),
  cloudLoadLoyalty: vi.fn(async () => null),
  cloudLoadInventory: vi.fn(async () => null),
  cloudLoadFinance: vi.fn(async () => null),
  cloudLoadForms: vi.fn(async () => null),
  cloudLoadReports: vi.fn(async () => null)
}));

describe("Phase C — sync queue & device sync", () => {
  beforeEach(() => {
    const g = globalThis as { __NF3_CLOUD_RESTORED__?: boolean };
    g.__NF3_CLOUD_RESTORED__ = true;
    ensurePosSeeded();
    const s = store();
    s.posSyncQueue = [];
    s.posOrders = [];
    s.posCarts = {};
    s.posShifts = [];
  });

  it("enqueues order on create and counts pending", () => {
    const opened = openShift({
      outletId: "kbu",
      registerId: "reg-kbu-1",
      shiftLabel: "Pagi",
      openingFloat: 500_000,
      openedBy: "u1",
      openedByName: "Kasir"
    });
    const shiftId = opened.shift!.id;

    addToCart(shiftId, "mi-nasi-goreng", 1);

    const order = createOrderFromCart({
      shiftId,
      outletId: "kbu",
      channel: "dine_in",
      tableLabel: "T1",
      createdBy: "Kasir"
    });

    expect(order).not.toBeNull();
    expect(order!.syncStatus).toBe("pending");
    expect(getPendingSyncCount("kbu")).toBe(1);

    const summary = getSyncCategorySummary("kbu");
    expect(summary.penjualan).toBe(1);
    expect(summary.total).toBe(1);
  });

  it("dedupes queue entries and upgrades action to complete", () => {
    const order: import("./pos-kds-roadmap").PosOrder = {
      id: "ord-c-1",
      outletId: "kbu",
      shiftId: "sh-1",
      orderNumber: "T-001",
      channel: "dine_in",
      status: "open",
      paymentStatus: "unpaid",
      subtotal: 50_000,
      discountAmount: 0,
      taxAmount: 0,
      serviceChargeAmount: 0,
      total: 50_000,
      items: [],
      payments: [],
      createdBy: "Kasir",
      createdAt: new Date().toISOString()
    };
    store().posOrders.push(order);

    touchOrderSync(order, "create");
    touchOrderSync(order, "update");
    expect(getPendingSyncCount("kbu")).toBe(1);

    order.status = "completed";
    order.paymentStatus = "paid";
    touchOrderSync(order, "complete");
    expect(store().posSyncQueue[0]?.action).toBe("complete");
  });

  it("processes queue and marks orders synced", async () => {
    const order: import("./pos-kds-roadmap").PosOrder = {
      id: "ord-c-2",
      outletId: "kbu",
      shiftId: "sh-1",
      orderNumber: "T-002",
      channel: "takeaway",
      status: "open",
      paymentStatus: "unpaid",
      subtotal: 28_000,
      discountAmount: 0,
      taxAmount: 0,
      serviceChargeAmount: 0,
      total: 28_000,
      items: [],
      payments: [],
      createdBy: "Kasir",
      createdAt: new Date().toISOString(),
      syncStatus: "pending"
    };
    store().posOrders.push(order);
    store().posSyncQueue.push({
      id: "SYN-TEST-1",
      outletId: "kbu",
      entity: "order",
      entityId: order.id,
      action: "create",
      createdAt: new Date().toISOString()
    });

    expect(getPendingSyncCount("kbu")).toBe(1);

    const result = await processPosSyncQueue("kbu");
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(0);
    expect(getPendingSyncCount("kbu")).toBe(0);
    expect(store().posOrders.find((o) => o.id === order.id)?.syncStatus).toBe("synced");
  });
});
