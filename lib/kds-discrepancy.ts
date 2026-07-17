import type { KdsFlowStatus } from "@/types/kds";
import { PHASE0_FLAGS } from "./phase0-flags";
import { store } from "./store";

export type KdsDiscrepancyEntry = {
  at: string;
  orderId: string;
  itemId: string;
  boardStatus: KdsFlowStatus;
  posStatus: string;
};

const FLOW_TO_POS: Record<KdsFlowStatus, string[]> = {
  baru: ["fired"],
  diproces: ["cooking"],
  siap: ["ready", "served"],
  problem: ["cooking"],
  selesai: ["ready", "served"]
};

const g = globalThis as unknown as {
  __NF3_KDS_DISCREPANCY_LOG__?: KdsDiscrepancyEntry[];
};

const MAX_LOG = 100;

function expectedPosStatuses(boardStatus: KdsFlowStatus): string[] {
  return FLOW_TO_POS[boardStatus] ?? [];
}

export function detectKdsDiscrepanciesForOrder(orderId: string): KdsDiscrepancyEntry[] {
  const at = new Date().toISOString();
  const order = store().posOrders.find((o) => o.id === orderId);
  const ticket = store().kdsBoardTickets.find((t) => t.orderId === orderId);
  if (!order || !ticket) return [];

  const entries: KdsDiscrepancyEntry[] = [];
  for (const boardItem of ticket.items) {
    const line = order.items.find((it) => it.id === boardItem.itemId);
    if (!line || line.status === "void") continue;
    const expected = expectedPosStatuses(boardItem.status);
    if (!expected.includes(line.status)) {
      entries.push({
        at,
        orderId,
        itemId: boardItem.itemId,
        boardStatus: boardItem.status,
        posStatus: line.status
      });
    }
  }
  return entries;
}

export function appendKdsDiscrepancyLog(entries: KdsDiscrepancyEntry[]) {
  if (!PHASE0_FLAGS.kdsCanonicalBoardWriter || entries.length === 0) return;
  const log = g.__NF3_KDS_DISCREPANCY_LOG__ ?? [];
  g.__NF3_KDS_DISCREPANCY_LOG__ = [...entries, ...log].slice(0, MAX_LOG);
}

export function recentKdsDiscrepancyLog(limit = 20): KdsDiscrepancyEntry[] {
  return (g.__NF3_KDS_DISCREPANCY_LOG__ ?? []).slice(0, limit);
}

export function recordKdsDiscrepancies(orderId: string) {
  if (!PHASE0_FLAGS.kdsCanonicalBoardWriter) return;
  appendKdsDiscrepancyLog(detectKdsDiscrepanciesForOrder(orderId));
}

export function auditKdsDiscrepancies(outletId?: string) {
  const checkedAt = new Date().toISOString();
  const enabled = PHASE0_FLAGS.kdsCanonicalBoardWriter;

  if (!enabled) {
    return {
      checkedAt,
      enabled: false,
      totals: { tickets: 0, discrepancies: 0 },
      discrepancies: [] as KdsDiscrepancyEntry[],
      recentLog: recentKdsDiscrepancyLog()
    };
  }

  const tickets = store().kdsBoardTickets.filter((t) => !outletId || t.outletId === outletId);
  const discrepancies = tickets.flatMap((t) => detectKdsDiscrepanciesForOrder(t.orderId));
  appendKdsDiscrepancyLog(discrepancies);

  return {
    checkedAt,
    enabled: true,
    totals: { tickets: tickets.length, discrepancies: discrepancies.length },
    discrepancies,
    recentLog: recentKdsDiscrepancyLog()
  };
}
