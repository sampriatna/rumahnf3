import { describe, expect, it, beforeEach } from "vitest";
import { store } from "./store";
import { ensurePosSeeded, openShift, getCashDrawerSummary } from "./pos-service";
import { addOutletExpense } from "./pos-outlet-expense";
import {
  closeStoreDay,
  isStoreClosedForDay,
  openStoreDay,
  getPosBusinessDate
} from "./pos-store-day";

describe("Phase A — outlet expenses & store day", () => {
  beforeEach(() => {
    ensurePosSeeded();
    const s = store();
    s.posShifts = [];
    s.posStoreDays = [];
    s.posCarts = {};
  });

  it("total kas akhir = kas awal + tunai − pengeluaran", () => {
    const opened = openShift({
      outletId: "kbu",
      registerId: "reg-kbu-1",
      shiftLabel: "Pagi",
      openingFloat: 500_000,
      openedBy: "u1",
      openedByName: "Kasir"
    });
    const shiftId = opened.shift!.id;
    store().posOrders.push({
      id: "ord-phase-a",
      outletId: "kbu",
      shiftId,
      orderNumber: "T-001",
      channel: "dine_in",
      status: "completed",
      paymentStatus: "paid",
      subtotal: 1_200_000,
      discountAmount: 0,
      taxAmount: 0,
      serviceChargeAmount: 0,
      total: 1_200_000,
      items: [],
      payments: [
        {
          id: "pay-1",
          method: "cash",
          amount: 1_200_000,
          status: "captured"
        }
      ],
      createdBy: "Kasir",
      createdAt: new Date().toISOString()
    });

    addOutletExpense({
      shiftId,
      category: "Operasional",
      amount: 50_000,
      note: "Es batu",
      createdBy: "Kasir"
    });

    const summary = getCashDrawerSummary(shiftId)!;
    expect(summary.outletExpensesTotal).toBe(50_000);
    expect(summary.totalKasAkhir).toBe(500_000 + 1_200_000 - 50_000);
    expect(summary.expectedCash).toBe(summary.totalKasAkhir);
  });

  it("blocks open shift when store closed", () => {
    closeStoreDay({ outletId: "kbu", closedBy: "Leader" });
    expect(isStoreClosedForDay("kbu")).toBe(true);

    const res = openShift({
      outletId: "kbu",
      registerId: "reg-kbu-1",
      shiftLabel: "Pagi",
      openingFloat: 500_000,
      openedBy: "u1",
      openedByName: "Kasir"
    });
    expect(res.error).toMatch(/Toko ditutup/);
  });

  it("reopens store for the business day", () => {
    closeStoreDay({ outletId: "kbu", closedBy: "Leader" });
    openStoreDay({ outletId: "kbu", openedBy: "Leader" });
    expect(isStoreClosedForDay("kbu")).toBe(false);
    expect(getPosBusinessDate()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
