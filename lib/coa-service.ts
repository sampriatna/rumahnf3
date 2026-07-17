import { store, nextId, persistStore } from "./store";
import { COA_SEED } from "./coa-seed";
import { ACCOUNTS, type AccountId } from "./finance";

export type CoaAccountType = "asset" | "liability" | "equity" | "revenue" | "expense";

export type ChartOfAccount = {
  id: string;
  code: string;
  name: string;
  accountType: CoaAccountType;
  trackBalance: boolean;
  ready: boolean;
  sortOrder: number;
  active: boolean;
};

export type CoaSaveError = "duplicate" | "invalid" | "not-found" | "system";

const SYSTEM_IDS = new Set(COA_SEED.map((r) => r.id));

function normalizeCode(code: string) {
  return code.trim().replace(/\s+/g, "");
}

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function ensureCoaReady() {
  if (store().chartOfAccounts.length === 0) bootstrapCoaFromSeed();
}

export function bootstrapCoaFromSeed() {
  COA_SEED.forEach((row, i) => {
    upsertChartOfAccount({
      id: row.id,
      code: row.code,
      name: row.name,
      accountType: row.accountType,
      trackBalance: row.trackBalance ?? true,
      ready: row.ready ?? true,
      sortOrder: i + 1,
      active: true
    });
  });
  persistStore();
}

export function resetCoaFromSeed() {
  store().chartOfAccounts = [];
  bootstrapCoaFromSeed();
}

export function listChartOfAccounts(includeInactive = false): ChartOfAccount[] {
  ensureCoaReady();
  return store()
    .chartOfAccounts.filter((a) => includeInactive || a.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.code.localeCompare(b.code));
}

export function getChartOfAccount(id: string) {
  ensureCoaReady();
  return store().chartOfAccounts.find((a) => a.id === id);
}

export function coaAccountLabel(id: string): string {
  const coa = getChartOfAccount(id);
  if (coa) return coa.name;
  const legacy = ACCOUNTS[id as AccountId];
  if (legacy) return legacy.label;
  return id;
}

export function listLedgerAccountOptions() {
  return listChartOfAccounts().filter((a) => a.active && a.trackBalance);
}

export function upsertChartOfAccount(input: {
  id?: string;
  code: string;
  name: string;
  accountType?: CoaAccountType;
  trackBalance?: boolean;
  ready?: boolean;
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; account: ChartOfAccount }
  | { ok: false; error: CoaSaveError } {
  const code = normalizeCode(input.code);
  const name = normalizeName(input.name);
  if (!code || !name) return { ok: false, error: "invalid" };

  const s = store();
  const dupCode = s.chartOfAccounts.find(
    (x) => x.id !== input.id && x.code.toLowerCase() === code.toLowerCase()
  );
  if (dupCode) return { ok: false, error: "duplicate" };

  const existing = input.id ? s.chartOfAccounts.find((x) => x.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const accountType = input.accountType ?? existing?.accountType ?? "asset";
  if (!["asset", "liability", "equity", "revenue", "expense"].includes(accountType)) {
    return { ok: false, error: "invalid" };
  }

  const account: ChartOfAccount = {
    id: existing?.id ?? input.id ?? nextId("coa"),
    code,
    name,
    accountType,
    trackBalance: input.trackBalance ?? existing?.trackBalance ?? true,
    ready: input.ready ?? existing?.ready ?? true,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? s.chartOfAccounts.length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) {
    if (SYSTEM_IDS.has(existing.id) && existing.id !== account.id) {
      return { ok: false, error: "system" };
    }
    Object.assign(existing, account);
  } else {
    s.chartOfAccounts.push(account);
  }

  persistStore();
  return { ok: true, account };
}

export function toggleChartOfAccountActive(id: string, active: boolean) {
  const account = getChartOfAccount(id);
  if (!account) return { ok: false as const, error: "not-found" as const };
  account.active = active;
  persistStore();
  return { ok: true as const };
}
