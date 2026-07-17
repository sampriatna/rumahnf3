import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("./pos-service", () => ({
  ensurePosSeeded: vi.fn(),
  getOpenShift: vi.fn()
}));

import { getOpenShift } from "./pos-service";
import { buildPosSalesSnapshot } from "./pos-report-snapshot";
import { store } from "./store";

describe("buildPosSalesSnapshot", () => {
  beforeEach(() => {
    const s = store();
    s.posOrders = [
      {
        id: "O1",
        outletId: "kbu",
        orderNumber: "KBU-1",
        channel: "dine_in",
        status: "completed",
        paymentStatus: "paid",
        subtotal: 100_000,
        discountAmount: 0,
        taxAmount: 0,
        serviceChargeAmount: 0,
        total: 100_000,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        items: [],
        payments: []
      }
    ];
    vi.mocked(getOpenShift).mockReturnValue(undefined);
  });

  it("menghitung omzet completed hari ini per outlet", () => {
    const snap = buildPosSalesSnapshot("kbu");
    expect(snap.totalOrders).toBe(1);
    expect(snap.byOutlet[0]?.omzetCompleted).toBe(100_000);
  });
});
