import { describe, expect, it, beforeEach, vi } from "vitest";
import type { PosShift } from "./pos-kds-roadmap";
import { mergePosShifts, store } from "./store";
import { ensurePosSeeded, openShift, getOpenShift, closeShift } from "./pos-service";

vi.mock("./wa", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./wa")>();
  return {
    ...actual,
    sendWaNotification: vi.fn(async () => ({
      id: "wa-test",
      event: "approval_pending",
      target: "leader",
      status: "queued",
      message: "test",
      createdAt: new Date().toISOString()
    }))
  };
});

function sampleShift(overrides: Partial<PosShift> = {}): PosShift {
  return {
    id: "SHF-0001",
    outletId: "kbu",
    registerId: "reg-kbu-1",
    shiftLabel: "Pagi",
    openedBy: "Kasir",
    openingFloat: 500_000,
    status: "open",
    openedAt: "2026-07-15T08:00:00.000Z",
    systemCashTotal: 0,
    systemQrisTotal: 0,
    systemOnlineTotal: 0,
    systemGrandTotal: 0,
    orderCount: 0,
    ...overrides
  };
}

describe("mergePosShifts", () => {
  it("prefers closed local shift over stale open remote", () => {
    const local = [
      sampleShift({
        status: "closed",
        closedAt: "2026-07-15T16:00:00.000Z",
        closedBy: "Kasir"
      })
    ];
    const remote = [sampleShift({ status: "open", closedAt: undefined, closedBy: undefined })];
    const merged = mergePosShifts(local, remote);
    expect(merged).toHaveLength(1);
    expect(merged[0].status).toBe("closed");
  });

  it("keeps closed remote when local is still open", () => {
    const local = [sampleShift({ status: "open" })];
    const remote = [
      sampleShift({
        status: "closed",
        closedAt: "2026-07-15T16:00:00.000Z",
        closedBy: "Kasir"
      })
    ];
    const merged = mergePosShifts(local, remote);
    expect(merged[0].status).toBe("closed");
  });
});

describe("shift close persistence", () => {
  beforeEach(() => {
    ensurePosSeeded();
    const s = store();
    s.posShifts = [];
    s.posCarts = {};
    s.posOrders = [];
    s.submissions = [];
    s.approvals = [];
  });

  it("getOpenShift returns undefined after closeShift", async () => {
    const opened = openShift({
      outletId: "kbu",
      registerId: "reg-kbu-1",
      shiftLabel: "Pagi",
      openingFloat: 500_000,
      openedBy: "u1",
      openedByName: "Kasir"
    });
    const shiftId = opened.shift!.id;
    expect(getOpenShift("kbu")?.id).toBe(shiftId);

    const closed = await closeShift({
      shiftId,
      closedBy: "u1",
      closedByName: "Kasir",
      userId: "u1"
    });
    expect(closed.error).toBeUndefined();
    expect(getOpenShift("kbu")).toBeUndefined();
    expect(store().posShifts.find((sh) => sh.id === shiftId)?.status).toBe("closed");
  });

  it("dedupes multiple open shifts per outlet", () => {
    const older = sampleShift({
      id: "SHF-old",
      openedAt: "2026-07-15T06:00:00.000Z"
    });
    const newer = sampleShift({
      id: "SHF-new",
      openedAt: "2026-07-15T10:00:00.000Z"
    });
    store().posShifts = [older, newer];

    const open = getOpenShift("kbu");
    expect(open?.id).toBe("SHF-new");
    expect(older.status).toBe("closed");
    expect(older.closedBy).toBe("Sistem");
  });
});
