import { beforeEach, describe, expect, it } from "vitest";
import {
  canAccessPurchasingFeature,
  canInputFinanceAccount,
  canViewFinanceAccount,
  financeAccessForSession
} from "./finance-access";
import { listLedger, recordLedger, transferBetweenAccounts, getAccountBalances } from "./finance-service";
import { store } from "./store";
import type { SessionPayload } from "./session-token";

function resetFinanceState() {
  const s = store();
  s.financeSeeded = false;
  s.accountBalances = {} as typeof s.accountBalances;
  s.ledger = [];
  s.debts = [];
  s.receivables = [];
  s.heldCash = [];
}

function asSession(input: Partial<SessionPayload>): SessionPayload {
  return {
    sub: input.sub ?? "u-test",
    role: input.role ?? "staff",
    name: input.name ?? "Tester",
    outletId: input.outletId,
    email: input.email,
    phone: input.phone,
    capabilities: input.capabilities,
    isSuperAdmin: input.isSuperAdmin,
    exp: input.exp ?? 9999999999
  };
}

describe("Jagasatru purchasing access", () => {
  it("membatasi Abdul hanya ke dompet Jagasatru + Rekening", () => {
    const abdul = asSession({
      sub: "u-abdul",
      role: "staff",
      name: "Abdul Khafid",
      email: "abdulkhafid0910@gmail.com",
      capabilities: ["inventory", "forms"]
    });

    const access = financeAccessForSession(abdul);
    expect(access.canOpenFinance).toBe(true);
    expect(access.areaUnit).toBe("Jagasatru");
    expect(access.viewAccounts).toEqual(["jagasatru_wallet", "bank"]);
    expect(access.inputAccounts).toEqual(["jagasatru_wallet", "bank"]);
    expect(access.canTransfer).toBe(false);

    expect(canViewFinanceAccount(abdul, "jagasatru_wallet")).toBe(true);
    expect(canViewFinanceAccount(abdul, "bank")).toBe(true);
    expect(canViewFinanceAccount(abdul, "purchasing_kecil_wallet")).toBe(false);
    expect(canInputFinanceAccount(abdul, "purchasing_kecil_wallet")).toBe(false);
    expect(canAccessPurchasingFeature(abdul)).toBe(true);
  });

  it("owner tetap bisa melihat semua dompet", () => {
    const owner = asSession({
      sub: "u-owner",
      role: "owner",
      name: "Sam Owner",
      email: "owner@example.com"
    });
    const access = financeAccessForSession(owner);
    expect(access.canOpenFinance).toBe(true);
    expect(access.canTransfer).toBe(true);
    expect(access.viewAccounts).toContain("jagasatru_wallet");
    expect(access.viewAccounts).toContain("purchasing_kecil_wallet");
    expect(access.viewAccounts).toContain("cash_physical");
    expect(access.viewAccounts).toContain("bank");
  });
});

describe("Jagasatru ledger money flow", () => {
  beforeEach(() => {
    resetFinanceState();
  });

  it("transfer Kas Besar -> Jagasatru menghasilkan transfer_ref yang sama", () => {
    const before = { ...getAccountBalances() };
    const transfer = transferBetweenAccounts({
      fromAccountId: "cash_physical",
      toAccountId: "jagasatru_wallet",
      amount: 1_000_000,
      category: "Transfer Antar Dompet",
      createdBy: "Owner",
      areaUnit: "Jagasatru",
      note: "Topup Jagasatru"
    });

    expect(transfer).not.toBeNull();
    expect(transfer?.outEntry.transferRef).toBeTruthy();
    expect(transfer?.outEntry.transferRef).toBe(transfer?.inEntry.transferRef);

    const after = getAccountBalances();
    expect(after.cash_physical).toBe((before.cash_physical ?? 0) - 1_000_000);
    expect(after.jagasatru_wallet).toBe((before.jagasatru_wallet ?? 0) + 1_000_000);
    expect(after.purchasing_kecil_wallet).toBe(before.purchasing_kecil_wallet ?? 0);
  });

  it("belanja Abdul dari Jagasatru mengurangi Jagasatru saja", () => {
    transferBetweenAccounts({
      fromAccountId: "cash_physical",
      toAccountId: "jagasatru_wallet",
      amount: 500_000,
      category: "Transfer Antar Dompet",
      createdBy: "Owner",
      areaUnit: "Jagasatru"
    });
    const before = { ...getAccountBalances() };

    recordLedger({
      accountId: "jagasatru_wallet",
      transactionType: "out",
      category: "Belanja Bahan",
      amount: 100_000,
      paymentMethod: "Transfer",
      areaUnit: "Jagasatru",
      verificationStatus: "pending",
      evidenceUrl: "https://example.com/nota.jpg",
      createdBy: "Abdul Khafid"
    });

    const after = getAccountBalances();
    expect(after.jagasatru_wallet).toBe((before.jagasatru_wallet ?? 0) - 100_000);
    expect(after.purchasing_kecil_wallet).toBe(before.purchasing_kecil_wallet ?? 0);

    const latest = listLedger(1)[0];
    expect(latest.accountId).toBe("jagasatru_wallet");
    expect(latest.areaUnit).toBe("Jagasatru");
    expect(latest.verificationStatus).toBe("pending");
    expect(latest.createdBy).toBe("Abdul Khafid");
  });
});
