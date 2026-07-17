import { describe, expect, it, beforeEach } from "vitest";
import { store } from "./store";
import { ensurePosSeeded } from "./pos-service";
import { getCustomer } from "./loyalty-service";
import {
  topUpMemberDeposit,
  getMemberDepositBalance,
  listMemberDepositTxns
} from "./pos-member-deposit";
import {
  clockIn,
  clockOut,
  getOpenAttendance,
  listOutletAttendanceToday
} from "./pos-attendance";

describe("Phase D — member deposit & attendance", () => {
  beforeEach(() => {
    ensurePosSeeded();
    getCustomer("cust-1");
    store().memberDepositTxns = [];
    store().posAttendanceRecords = [];
  });

  it("tops up member deposit and records ledger", () => {
    const customer = getCustomer("cust-1")!;
    const before = customer.depositBalance ?? 0;

    const result = topUpMemberDeposit({
      customerId: "cust-1",
      outletId: "kbu",
      shiftId: "sh-test",
      amount: 50_000,
      note: "Tunai",
      createdBy: "Leader"
    });

    expect(result.error).toBeUndefined();
    expect(result.balance).toBe(before + 50_000);
    expect(getMemberDepositBalance("cust-1")).toBe(before + 50_000);
    expect(listMemberDepositTxns("cust-1")).toHaveLength(1);
    expect(listMemberDepositTxns("cust-1")[0]?.type).toBe("top_up");
  });

  it("rejects top-up for invalid amount", () => {
    const result = topUpMemberDeposit({
      customerId: "cust-1",
      outletId: "kbu",
      amount: 0,
      createdBy: "Leader"
    });
    expect(result.error).toBeTruthy();
  });

  it("clock-in and clock-out for staff", () => {
    const inlet = clockIn({
      outletId: "kbu",
      userId: "u-staff-1",
      userName: "Kasir A",
      userRole: "staff"
    });
    expect(inlet.error).toBeUndefined();
    expect(getOpenAttendance("u-staff-1", "kbu")).toBeDefined();
    expect(listOutletAttendanceToday("kbu")).toHaveLength(1);

    const duplicate = clockIn({
      outletId: "kbu",
      userId: "u-staff-1",
      userName: "Kasir A",
      userRole: "staff"
    });
    expect(duplicate.error).toBeTruthy();

    const out = clockOut({ outletId: "kbu", userId: "u-staff-1" });
    expect(out.error).toBeUndefined();
    expect(out.record?.clockOutAt).toBeTruthy();
    expect(getOpenAttendance("u-staff-1", "kbu")).toBeUndefined();
  });
});
