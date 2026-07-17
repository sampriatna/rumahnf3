import {
  cloudLoad,
  cloudLoadFinance,
  cloudLoadForms,
  cloudLoadInventory,
  cloudLoadPos
} from "./cloud-persist";
import { PHASE0_FLAGS } from "./phase0-flags";
import { store } from "./store";

export type PersistenceDomain = "pos" | "finance" | "inventory" | "forms" | "app_state";

export type DomainMetricCounts = Record<string, number>;

export type PersistenceMismatchEntry = {
  at: string;
  domain: PersistenceDomain;
  metric: string;
  memory: number;
  relational: number | null;
  appState: number | null;
};

export type DomainMismatchSnapshot = {
  domain: PersistenceDomain;
  memory: DomainMetricCounts;
  relational: DomainMetricCounts | null;
  appState: DomainMetricCounts | null;
  mismatches: PersistenceMismatchEntry[];
};

export type PersistenceMismatchReport = {
  checkedAt: string;
  enabled: boolean;
  totals: { domains: number; mismatches: number };
  domains: DomainMismatchSnapshot[];
  recentLog: PersistenceMismatchEntry[];
  memoryOnlyFields: string[];
};

const MEMORY_ONLY_FIELDS = [
  "kdsBoardTickets",
  "kdsBoardServedToday",
  "posCarts",
  "posOrderDaySeq"
];

const POS_METRICS = ["posOrders", "posShifts", "kdsTickets", "menuItems"] as const;
const FINANCE_METRICS = ["ledger", "debts", "receivables"] as const;
const INVENTORY_METRICS = ["items", "movements", "purchaseOrders", "stockTransferRequests"] as const;
const FORMS_METRICS = ["submissions", "approvals"] as const;

const g = globalThis as unknown as {
  __NF3_MISMATCH_LOG__?: PersistenceMismatchEntry[];
};

const MAX_LOG = 100;

function len(v: unknown[] | undefined) {
  return v?.length ?? 0;
}

function objLen(v: Record<string, unknown> | undefined) {
  return v ? Object.keys(v).length : 0;
}

export function memoryDomainCounts(): Record<PersistenceDomain, DomainMetricCounts> {
  const s = store();
  return {
    pos: {
      posOrders: len(s.posOrders),
      posShifts: len(s.posShifts),
      kdsTickets: len(s.kdsTickets),
      menuItems: len(s.menuItems),
      kdsBoardTickets: len(s.kdsBoardTickets)
    },
    finance: {
      ledger: len(s.ledger),
      debts: len(s.debts),
      receivables: len(s.receivables),
      accountBalances: objLen(s.accountBalances as Record<string, unknown>)
    },
    inventory: {
      items: len(s.items),
      movements: len(s.movements),
      purchaseOrders: len(s.purchaseOrders),
      stockTransferRequests: len(s.stockTransferRequests)
    },
    forms: {
      submissions: len(s.submissions),
      approvals: len(s.approvals),
      notificationLogs: len(s.notificationLogs)
    },
    app_state: {
      posOrders: len(s.posOrders),
      ledger: len(s.ledger),
      submissions: len(s.submissions),
      items: len(s.items)
    }
  };
}

function posCountsFromSnapshot(snap: {
  posOrders?: unknown[];
  posShifts?: unknown[];
  kdsTickets?: unknown[];
  menuItems?: unknown[];
}): DomainMetricCounts {
  return {
    posOrders: len(snap.posOrders),
    posShifts: len(snap.posShifts),
    kdsTickets: len(snap.kdsTickets),
    menuItems: len(snap.menuItems)
  };
}

function financeCountsFromSnapshot(snap: {
  ledger?: unknown[];
  debts?: unknown[];
  receivables?: unknown[];
  accountBalances?: Record<string, unknown>;
}): DomainMetricCounts {
  return {
    ledger: len(snap.ledger),
    debts: len(snap.debts),
    receivables: len(snap.receivables),
    accountBalances: objLen(snap.accountBalances)
  };
}

function inventoryCountsFromSnapshot(snap: {
  items?: unknown[];
  movements?: unknown[];
  purchaseOrders?: unknown[];
  stockTransferRequests?: unknown[];
}): DomainMetricCounts {
  return {
    items: len(snap.items),
    movements: len(snap.movements),
    purchaseOrders: len(snap.purchaseOrders),
    stockTransferRequests: len(snap.stockTransferRequests)
  };
}

function formsCountsFromSnapshot(snap: {
  submissions?: unknown[];
  approvals?: unknown[];
  notificationLogs?: unknown[];
}): DomainMetricCounts {
  return {
    submissions: len(snap.submissions),
    approvals: len(snap.approvals),
    notificationLogs: len(snap.notificationLogs)
  };
}

export function compareDomainMetrics(input: {
  domain: PersistenceDomain;
  at: string;
  memory: DomainMetricCounts;
  relational?: DomainMetricCounts | null;
  appState?: DomainMetricCounts | null;
  metrics: readonly string[];
}): PersistenceMismatchEntry[] {
  const entries: PersistenceMismatchEntry[] = [];

  for (const metric of input.metrics) {
    const memory = input.memory[metric] ?? 0;
    const relational = input.relational?.[metric] ?? null;
    const appState = input.appState?.[metric] ?? null;

    if (relational != null && memory !== relational) {
      entries.push({
        at: input.at,
        domain: input.domain,
        metric,
        memory,
        relational,
        appState
      });
    } else if (appState != null && memory !== appState) {
      entries.push({
        at: input.at,
        domain: input.domain,
        metric,
        memory,
        relational,
        appState
      });
    }
  }

  return entries;
}

export function appendMismatchLog(entries: PersistenceMismatchEntry[]) {
  if (!PHASE0_FLAGS.persistenceMismatchLog || entries.length === 0) return;
  const log = g.__NF3_MISMATCH_LOG__ ?? [];
  g.__NF3_MISMATCH_LOG__ = [...entries, ...log].slice(0, MAX_LOG);
}

export function recentMismatchLog(limit = 20): PersistenceMismatchEntry[] {
  return (g.__NF3_MISMATCH_LOG__ ?? []).slice(0, limit);
}

export async function auditPersistenceMismatch(): Promise<PersistenceMismatchReport> {
  const checkedAt = new Date().toISOString();
  const enabled = PHASE0_FLAGS.persistenceMismatchLog;

  if (!enabled) {
    return {
      checkedAt,
      enabled: false,
      totals: { domains: 0, mismatches: 0 },
      domains: [],
      recentLog: recentMismatchLog(),
      memoryOnlyFields: MEMORY_ONLY_FIELDS
    };
  }

  const memory = memoryDomainCounts();
  const [posRel, finRel, invRel, formsRel, appStateRaw] = await Promise.all([
    cloudLoadPos(),
    cloudLoadFinance(),
    cloudLoadInventory(),
    cloudLoadForms(),
    cloudLoad()
  ]);

  const appStatePos = appStateRaw ? posCountsFromSnapshot(appStateRaw as never) : null;
  const appStateFinance = appStateRaw ? financeCountsFromSnapshot(appStateRaw as never) : null;
  const appStateInventory = appStateRaw ? inventoryCountsFromSnapshot(appStateRaw as never) : null;
  const appStateForms = appStateRaw ? formsCountsFromSnapshot(appStateRaw as never) : null;

  const domains: DomainMismatchSnapshot[] = [
    {
      domain: "pos",
      memory: memory.pos,
      relational: posRel ? posCountsFromSnapshot(posRel) : null,
      appState: appStatePos,
      mismatches: compareDomainMetrics({
        domain: "pos",
        at: checkedAt,
        memory: memory.pos,
        relational: posRel ? posCountsFromSnapshot(posRel) : null,
        appState: appStatePos,
        metrics: POS_METRICS
      })
    },
    {
      domain: "finance",
      memory: memory.finance,
      relational: finRel ? financeCountsFromSnapshot(finRel) : null,
      appState: appStateFinance,
      mismatches: compareDomainMetrics({
        domain: "finance",
        at: checkedAt,
        memory: memory.finance,
        relational: finRel ? financeCountsFromSnapshot(finRel) : null,
        appState: appStateFinance,
        metrics: FINANCE_METRICS
      })
    },
    {
      domain: "inventory",
      memory: memory.inventory,
      relational: invRel ? inventoryCountsFromSnapshot(invRel) : null,
      appState: appStateInventory,
      mismatches: compareDomainMetrics({
        domain: "inventory",
        at: checkedAt,
        memory: memory.inventory,
        relational: invRel ? inventoryCountsFromSnapshot(invRel) : null,
        appState: appStateInventory,
        metrics: INVENTORY_METRICS
      })
    },
    {
      domain: "forms",
      memory: memory.forms,
      relational: formsRel ? formsCountsFromSnapshot(formsRel) : null,
      appState: appStateForms,
      mismatches: compareDomainMetrics({
        domain: "forms",
        at: checkedAt,
        memory: memory.forms,
        relational: formsRel ? formsCountsFromSnapshot(formsRel) : null,
        appState: appStateForms,
        metrics: FORMS_METRICS
      })
    }
  ];

  const allMismatches = domains.flatMap((d) => d.mismatches);
  appendMismatchLog(allMismatches);

  return {
    checkedAt,
    enabled: true,
    totals: {
      domains: domains.length,
      mismatches: allMismatches.length
    },
    domains,
    recentLog: recentMismatchLog(),
    memoryOnlyFields: MEMORY_ONLY_FIELDS
  };
}
