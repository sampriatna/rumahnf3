import { supabaseAdmin } from "../supabase";
import type {
  LedgerEntry,
  Debt,
  Receivable,
  HeldCash,
  AccountId
} from "../finance";
import type { ChartOfAccount } from "../coa-service";

// ============================================================================
// Repository relasional Finance / Kas (Fase D2b lanjutan).
// accountBalances = Record<AccountId, number> ↔ baris finance_account_balances.
// Pull sekuensial (bukan Promise.all) — andal setelah DDL PostgREST.
// ============================================================================

export type FinanceSnapshot = {
  accountBalances: Record<AccountId, number>;
  ledger: LedgerEntry[];
  debts: Debt[];
  receivables: Receivable[];
  heldCash: HeldCash[];
  chartOfAccounts: ChartOfAccount[];
  financeSeeded: boolean;
};

const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const num = (v: unknown): number => (v == null ? 0 : Number(v));

// ---- map: app -> row -------------------------------------------------------
const balanceRows = (balances: Record<AccountId, number>) =>
  Object.entries(balances).map(([account_id, balance]) => ({
    account_id,
    balance
  }));

const ledgerRow = (e: LedgerEntry) => ({
  id: e.id,
  date: e.date,
  outlet_id: n(e.outletId),
  outlet_name: n(e.outletName),
  account_id: e.accountId,
  transaction_type: e.transactionType,
  category: e.category,
  amount: e.amount,
  payment_method: n(e.paymentMethod),
  source_doc_type: n(e.sourceDocType),
  source_doc_id: n(e.sourceDocId),
  transfer_ref: n(e.transferRef),
  area_unit: n(e.areaUnit),
  verification_status: n(e.verificationStatus),
  verified_by: n(e.verifiedBy),
  evidence_url: n(e.evidenceUrl),
  note: n(e.note),
  created_by: e.createdBy,
  created_at: e.createdAt
});

const debtRow = (d: Debt) => ({
  id: d.id,
  debt_type: d.type,
  party: d.party,
  amount: d.amount,
  due_date: d.dueDate,
  status: d.status,
  source_doc_type: n(d.sourceDocType),
  source_doc_id: n(d.sourceDocId),
  note: n(d.note),
  created_at: d.createdAt
});

const receivableRow = (r: Receivable) => ({
  id: r.id,
  party: r.party,
  amount: r.amount,
  due_date: r.dueDate,
  status: r.status,
  note: n(r.note),
  created_at: r.createdAt
});

const heldCashRow = (h: HeldCash) => ({
  id: h.id,
  source: h.source,
  amount: h.amount,
  expected_release_date: n(h.expectedReleaseDate),
  status: h.status,
  source_doc_id: n(h.sourceDocId),
  created_at: h.createdAt
});

const coaRow = (a: ChartOfAccount) => ({
  id: a.id,
  code: a.code,
  name: a.name,
  account_type: a.accountType,
  track_balance: a.trackBalance,
  ready: a.ready,
  sort_order: a.sortOrder,
  active: a.active
});

const toCoa = (r: any): ChartOfAccount => ({
  id: r.id,
  code: r.code,
  name: r.name,
  accountType: r.account_type,
  trackBalance: r.track_balance ?? true,
  ready: r.ready ?? true,
  sortOrder: num(r.sort_order),
  active: r.active ?? true
});

// ---- map: row -> app -------------------------------------------------------
const balancesFromRows = (rows: any[]): Record<AccountId, number> => {
  const b = {} as Record<AccountId, number>;
  for (const r of rows) {
    b[r.account_id as AccountId] = num(r.balance);
  }
  return b;
};

const toLedger = (r: any): LedgerEntry => ({
  id: r.id,
  date: r.date,
  outletId: u(r.outlet_id),
  outletName: u(r.outlet_name),
  accountId: r.account_id as AccountId,
  transactionType: r.transaction_type,
  category: r.category,
  amount: num(r.amount),
  paymentMethod: u(r.payment_method),
  sourceDocType: u(r.source_doc_type),
  sourceDocId: u(r.source_doc_id),
  transferRef: u(r.transfer_ref),
  areaUnit: u(r.area_unit),
  verificationStatus: u(r.verification_status) as "verified" | "pending" | undefined,
  verifiedBy: u(r.verified_by),
  evidenceUrl: u(r.evidence_url),
  note: u(r.note),
  createdBy: r.created_by,
  createdAt: r.created_at
});

const toDebt = (r: any): Debt => ({
  id: r.id,
  type: r.debt_type,
  party: r.party,
  amount: num(r.amount),
  dueDate: r.due_date,
  status: r.status,
  sourceDocType: u(r.source_doc_type),
  sourceDocId: u(r.source_doc_id),
  note: u(r.note),
  createdAt: r.created_at
});

const toReceivable = (r: any): Receivable => ({
  id: r.id,
  party: r.party,
  amount: num(r.amount),
  dueDate: r.due_date,
  status: r.status,
  note: u(r.note),
  createdAt: r.created_at
});

const toHeldCash = (r: any): HeldCash => ({
  id: r.id,
  source: r.source,
  amount: num(r.amount),
  expectedReleaseDate: u(r.expected_release_date),
  status: r.status,
  sourceDocId: u(r.source_doc_id),
  createdAt: r.created_at
});

const COLS = {
  finance_account_balances: "account_id,balance",
  finance_ledger:
    "id,date,outlet_id,outlet_name,account_id,transaction_type,category,amount,payment_method,source_doc_type,source_doc_id,transfer_ref,area_unit,verification_status,verified_by,evidence_url,note,created_by,created_at",
  finance_debts:
    "id,debt_type,party,amount,due_date,status,source_doc_type,source_doc_id,note,created_at",
  finance_receivables: "id,party,amount,due_date,status,note,created_at",
  finance_held_cash: "id,source,amount,expected_release_date,status,source_doc_id,created_at",
  finance_chart_of_accounts:
    "id,code,name,account_type,track_balance,ready,sort_order,active"
} as const;

/** Tulis seluruh state finance ke tabel relasional (idempotent). */
export async function pushFinance(snap: FinanceSnapshot): Promise<void> {
  try {
    const db = supabaseAdmin();
    const balances = balanceRows(snap.accountBalances);
    if (balances.length) {
      await db.from("finance_account_balances").upsert(balances as never[], { onConflict: "account_id" });
    }
    if (snap.ledger.length) {
      await db.from("finance_ledger").upsert(snap.ledger.map(ledgerRow) as never[], { onConflict: "id" });
    }
    if (snap.debts.length) {
      await db.from("finance_debts").upsert(snap.debts.map(debtRow) as never[], { onConflict: "id" });
    }
    if (snap.receivables.length) {
      await db.from("finance_receivables").upsert(snap.receivables.map(receivableRow) as never[], { onConflict: "id" });
    }
    if (snap.heldCash.length) {
      await db.from("finance_held_cash").upsert(snap.heldCash.map(heldCashRow) as never[], { onConflict: "id" });
    }
    if (snap.chartOfAccounts?.length) {
      await db.from("finance_chart_of_accounts").upsert(snap.chartOfAccounts.map(coaRow) as never[], { onConflict: "id" });
    }
  } catch {
    /* abaikan — relasional opsional */
  }
}

/** Baca seluruh state finance dari relasional. null bila belum ada data. */
export async function pullFinance(): Promise<FinanceSnapshot | null> {
  try {
    const db = supabaseAdmin();
    const sel = async (t: keyof typeof COLS) => {
      const { data, error } = await db.from(t).select(COLS[t], { count: "exact" });
      if (error) return [] as any[];
      return (data ?? []) as any[];
    };
    const balanceRowsData = await sel("finance_account_balances");
    if (balanceRowsData.length === 0) return null;
    const ledger = await sel("finance_ledger");
    const debts = await sel("finance_debts");
    const receivables = await sel("finance_receivables");
    const heldCash = await sel("finance_held_cash");
    const chartOfAccounts = await sel("finance_chart_of_accounts");
    return {
      accountBalances: balancesFromRows(balanceRowsData),
      ledger: ledger.map(toLedger),
      debts: debts.map(toDebt),
      receivables: receivables.map(toReceivable),
      heldCash: heldCash.map(toHeldCash),
      chartOfAccounts: chartOfAccounts.map(toCoa),
      financeSeeded: true
    };
  } catch {
    return null;
  }
}
