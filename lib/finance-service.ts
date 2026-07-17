import {
  type LedgerEntry,
  type Debt,
  type Receivable,
  type HeldCash,
  type FinanceSummary,
  type AccountId,
  type TransactionType,
  ACCOUNTS,
  seedAccountBalances,
  seedReceivables,
  seedDebts
} from "./finance";
import { store, nextId } from "./store";
import { recordAuditEvent } from "./audit-log";

function ensureFinanceSeeded() {
  const s = store();
  if (!s.financeSeeded) {
    s.accountBalances = seedAccountBalances();
    s.ledger = [];
    s.debts = seedDebts();
    s.receivables = seedReceivables();
    s.heldCash = [];
    s.financeSeeded = true;
  }
}

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function addDays(iso: string, days: number) {
  return new Date(new Date(iso).getTime() + days * 86400000).toISOString();
}

export function recordLedger(input: {
  outletId?: string;
  outletName?: string;
  accountId: AccountId;
  transactionType: TransactionType;
  category: string;
  amount: number;
  paymentMethod?: string;
  sourceDocType?: string;
  sourceDocId?: string;
  transferRef?: string;
  areaUnit?: string;
  verificationStatus?: "verified" | "pending";
  verifiedBy?: string;
  evidenceUrl?: string;
  note?: string;
  createdBy: string;
}) {
  ensureFinanceSeeded();
  const s = store();
  const now = new Date().toISOString();
  const entry: LedgerEntry = {
    id: nextId("LED"),
    date: now,
    outletId: input.outletId,
    outletName: input.outletName,
    accountId: input.accountId,
    transactionType: input.transactionType,
    category: input.category,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    sourceDocType: input.sourceDocType,
    sourceDocId: input.sourceDocId,
    transferRef: input.transferRef,
    areaUnit: input.areaUnit,
    verificationStatus: input.verificationStatus ?? "verified",
    verifiedBy: input.verifiedBy,
    evidenceUrl: input.evidenceUrl,
    note: input.note,
    createdBy: input.createdBy,
    createdAt: now
  };

  const delta = input.transactionType === "in" ? input.amount : -input.amount;
  s.accountBalances[input.accountId] = (s.accountBalances[input.accountId] ?? 0) + delta;
  s.ledger.unshift(entry);
  return entry;
}

export function transferBetweenAccounts(input: {
  fromAccountId: AccountId;
  toAccountId: AccountId;
  amount: number;
  category?: string;
  createdBy: string;
  note?: string;
  areaUnit?: string;
}) {
  if (input.amount <= 0) return null;
  const transferRef = nextId("TRF");
  const category = input.category ?? "Transfer Antar Dompet";
  const outEntry = recordLedger({
    accountId: input.fromAccountId,
    transactionType: "out",
    category,
    amount: input.amount,
    paymentMethod: "Transfer",
    transferRef,
    areaUnit: input.areaUnit,
    note: input.note,
    createdBy: input.createdBy
  });
  const inEntry = recordLedger({
    accountId: input.toAccountId,
    transactionType: "in",
    category,
    amount: input.amount,
    paymentMethod: "Transfer",
    transferRef,
    areaUnit: input.areaUnit,
    note: input.note,
    createdBy: input.createdBy
  });
  recordAuditEvent({
    action: "finance.transfer",
    actorName: input.createdBy,
    entityType: "finance_transfer",
    entityId: transferRef,
    reason: input.note,
    meta: {
      fromAccountId: input.fromAccountId,
      toAccountId: input.toAccountId,
      amount: input.amount
    }
  });
  return { transferRef, outEntry, inEntry };
}

export function addHeldCash(input: {
  source: string;
  amount: number;
  sourceDocId?: string;
  releaseDays?: number;
}) {
  ensureFinanceSeeded();
  const hc: HeldCash = {
    id: nextId("HOLD"),
    source: input.source,
    amount: input.amount,
    expectedReleaseDate: addDays(new Date().toISOString(), input.releaseDays ?? 2),
    status: "pending",
    sourceDocId: input.sourceDocId,
    createdAt: new Date().toISOString()
  };
  store().heldCash.unshift(hc);
  return hc;
}

/** Batalkan kas tertahan yang masih pending untuk dokumen tertentu (void/refund). */
export function reverseHeldCashForDoc(sourceDocId: string) {
  ensureFinanceSeeded();
  const s = store();
  let removed = 0;
  s.heldCash = s.heldCash.filter((hc) => {
    if (hc.sourceDocId === sourceDocId && hc.status === "pending") {
      removed += hc.amount;
      return false;
    }
    return true;
  });
  return removed;
}

export function addDebt(input: Omit<Debt, "id" | "createdAt" | "status"> & { status?: Debt["status"] }) {
  ensureFinanceSeeded();
  const debt: Debt = {
    ...input,
    id: nextId("UTG"),
    status: input.status ?? "unpaid",
    createdAt: new Date().toISOString()
  };
  store().debts.unshift(debt);
  return debt;
}

/** Setoran kasir disetujui → pecah ke cash / QRIS / online pending. */
export function recordSetoranKasir(input: {
  outletId?: string;
  outletName?: string;
  cash: number;
  qris: number;
  online: number;
  sourceDocId: string;
  createdBy: string;
}) {
  const entries: LedgerEntry[] = [];
  if (input.cash > 0) {
    entries.push(
      recordLedger({
        outletId: input.outletId,
        outletName: input.outletName,
        accountId: "cash_physical",
        transactionType: "in",
        category: "Setoran Kasir",
        amount: input.cash,
        paymentMethod: "Cash",
        sourceDocType: "setoran_kasir",
        sourceDocId: input.sourceDocId,
        createdBy: input.createdBy
      })
    );
  }
  if (input.qris > 0) {
    recordLedger({
      outletId: input.outletId,
      outletName: input.outletName,
      accountId: "qris_pending",
      transactionType: "in",
      category: "QRIS",
      amount: input.qris,
      paymentMethod: "QRIS",
      sourceDocType: "setoran_kasir",
      sourceDocId: input.sourceDocId,
      note: "Menunggu pencairan",
      createdBy: input.createdBy
    });
    addHeldCash({ source: "QRIS", amount: input.qris, sourceDocId: input.sourceDocId, releaseDays: 1 });
  }
  if (input.online > 0) {
    recordLedger({
      outletId: input.outletId,
      outletName: input.outletName,
      accountId: "gofood_pending",
      transactionType: "in",
      category: "GoFood/Grab/Shopee",
      amount: input.online,
      paymentMethod: "Online",
      sourceDocType: "setoran_kasir",
      sourceDocId: input.sourceDocId,
      note: "Menunggu pencairan platform",
      createdBy: input.createdBy
    });
    addHeldCash({ source: "GoFood/Grab/Shopee", amount: input.online, sourceDocId: input.sourceDocId, releaseDays: 3 });
  }
  return entries;
}

/** PO diterima → utang supplier (default) atau kas keluar bila lunas cash. */
export function recordPurchasePayment(input: {
  supplierName: string;
  amount: number;
  poId: string;
  payNow: boolean;
  createdBy: string;
  dueDays?: number;
  accountId?: AccountId;
  areaUnit?: string;
}) {
  if (input.payNow && input.amount > 0) {
    return recordLedger({
      accountId: input.accountId ?? "bank",
      transactionType: "out",
      category: "Supplier",
      amount: input.amount,
      paymentMethod: "Transfer",
      sourceDocType: "purchase_order",
      sourceDocId: input.poId,
      areaUnit: input.areaUnit,
      note: `Bayar ${input.supplierName}`,
      createdBy: input.createdBy
    });
  }
  return addDebt({
    type: "supplier",
    party: input.supplierName,
    amount: input.amount,
    dueDate: addDays(new Date().toISOString(), input.dueDays ?? 14),
    sourceDocType: "purchase_order",
    sourceDocId: input.poId,
    note: `Utang PO ${input.poId}`
  });
}

export function payDebt(debtId: string, paidBy: string) {
  ensureFinanceSeeded();
  const debt = store().debts.find((d) => d.id === debtId);
  if (!debt || debt.status === "paid") return null;

  recordLedger({
    accountId: "bank",
    transactionType: "out",
    category: debt.type === "supplier" ? "Supplier" : "Biaya Lain",
    amount: debt.amount,
    paymentMethod: "Transfer",
    sourceDocType: "debt_payment",
    sourceDocId: debt.id,
    note: `Bayar utang: ${debt.party}`,
    createdBy: paidBy
  });
  debt.status = "paid";
  return debt;
}

export function listLedger(limit = 50) {
  ensureFinanceSeeded();
  return store().ledger.slice(0, limit);
}

export function listDebts() {
  ensureFinanceSeeded();
  return store().debts;
}

export function listReceivables() {
  ensureFinanceSeeded();
  return store().receivables;
}

export function listHeldCash() {
  ensureFinanceSeeded();
  return store().heldCash.filter((h) => h.status === "pending");
}

export function getFinanceSummary(): FinanceSummary {
  ensureFinanceSeeded();
  const s = store();
  const balances = s.accountBalances;

  const kasTersedia =
    (balances.cash_physical ?? 0) + (balances.bank ?? 0);

  const kasTertahan =
    (balances.qris_pending ?? 0) +
    (balances.marketplace_pending ?? 0) +
    (balances.gofood_pending ?? 0);

  const piutang = s.receivables
    .filter((r) => r.status === "unpaid")
    .reduce((sum, r) => sum + r.amount, 0);

  const now = Date.now();
  const in7days = now + 7 * 86400000;

  const utangJatuhTempo = s.debts
    .filter((d) => d.status !== "paid" && new Date(d.dueDate).getTime() <= in7days)
    .reduce((sum, d) => sum + d.amount, 0);

  const kebutuhanWajib7Hari = utangJatuhTempo;

  const kasMasukHariIni = s.ledger
    .filter((e) => e.transactionType === "in" && isToday(e.createdAt))
    .reduce((sum, e) => sum + e.amount, 0);

  const kasKeluarHariIni = s.ledger
    .filter((e) => e.transactionType === "out" && isToday(e.createdAt))
    .reduce((sum, e) => sum + e.amount, 0);

  const freeCash = kasTersedia - utangJatuhTempo - kebutuhanWajib7Hari;
  const totalUangBisnis = kasTersedia + kasTertahan + piutang;

  return {
    kasTersedia,
    kasMasukHariIni,
    kasKeluarHariIni,
    kasTertahan,
    piutang,
    utangJatuhTempo,
    kebutuhanWajib7Hari,
    freeCash,
    totalUangBisnis
  };
}

export function getAccountBalances() {
  ensureFinanceSeeded();
  return store().accountBalances;
}

export { ACCOUNTS };
