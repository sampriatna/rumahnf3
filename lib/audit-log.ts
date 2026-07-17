import { PHASE0_FLAGS } from "./phase0-flags";
import { nextId } from "./store";

export type AuditAction =
  | "pos.void_item"
  | "pos.void_order"
  | "pos.discount"
  | "pos.shift_close"
  | "finance.transfer"
  | "inventory.stock_in"
  | "inventory.opname_correction"
  | "inventory.po_receive"
  | "inventory.transfer_send"
  | "inventory.transfer_receive"
  | "inventory.transfer_cancel"
  | "inventory.recipe_upsert"
  | "inventory.recipe_delete"
  | "approval.decision";

export type AuditMetaValue = string | number | boolean | null;

export type AuditEvent = {
  id: string;
  at: string;
  action: AuditAction;
  actorId?: string;
  actorName: string;
  outletId?: string;
  entityType: string;
  entityId: string;
  reason?: string;
  meta?: Record<string, AuditMetaValue>;
};

export type AuditEventInput = Omit<AuditEvent, "id" | "at">;

const AUDIT_ACTIONS: AuditAction[] = [
  "pos.void_item",
  "pos.void_order",
  "pos.discount",
  "pos.shift_close",
  "finance.transfer",
  "inventory.stock_in",
  "inventory.opname_correction",
  "inventory.po_receive",
  "inventory.transfer_send",
  "inventory.transfer_receive",
  "inventory.transfer_cancel",
  "inventory.recipe_upsert",
  "inventory.recipe_delete",
  "approval.decision"
];

const g = globalThis as unknown as {
  __NF3_AUDIT_LOG__?: AuditEvent[];
};

const MAX_LOG = 200;

export function isAuditAction(value: string): value is AuditAction {
  return (AUDIT_ACTIONS as string[]).includes(value);
}

/** Validates audit payload contract (actor/action/entity/entity_id/outlet/timestamp). */
export function validateAuditEvent(event: AuditEvent): string[] {
  const errors: string[] = [];
  if (!event.id.trim()) errors.push("id wajib");
  if (!event.at.trim()) errors.push("at wajib");
  if (!isAuditAction(event.action)) errors.push("action tidak valid");
  if (!event.actorName.trim()) errors.push("actorName wajib");
  if (!event.entityType.trim()) errors.push("entityType wajib");
  if (!event.entityId.trim()) errors.push("entityId wajib");
  return errors;
}

export function buildAuditEvent(input: AuditEventInput): AuditEvent {
  return {
    id: nextId("AUD"),
    at: new Date().toISOString(),
    ...input
  };
}

function appendAuditLog(event: AuditEvent) {
  const log = g.__NF3_AUDIT_LOG__ ?? [];
  g.__NF3_AUDIT_LOG__ = [event, ...log].slice(0, MAX_LOG);
}

/**
 * Catat audit event sensitif. Side-effect ringan; tidak pernah throw agar transaksi tetap jalan.
 */
export function recordAuditEvent(input: AuditEventInput): AuditEvent | null {
  if (!PHASE0_FLAGS.auditLogFoundation) return null;
  try {
    const event = buildAuditEvent(input);
    const errors = validateAuditEvent(event);
    if (errors.length > 0) return null;
    appendAuditLog(event);
    return event;
  } catch {
    return null;
  }
}

export function recentAuditLog(limit = 20): AuditEvent[] {
  return (g.__NF3_AUDIT_LOG__ ?? []).slice(0, limit);
}

export function listAuditLog(limit = 100): AuditEvent[] {
  return recentAuditLog(limit);
}

export function auditLogSummary() {
  const checkedAt = new Date().toISOString();
  const enabled = PHASE0_FLAGS.auditLogFoundation;
  const log = recentAuditLog(50);
  const byAction: Record<string, number> = {};
  for (const entry of log) {
    byAction[entry.action] = (byAction[entry.action] ?? 0) + 1;
  }
  return {
    checkedAt,
    enabled,
    totals: { events: (g.__NF3_AUDIT_LOG__ ?? []).length },
    byAction,
    recent: recentAuditLog(10)
  };
}

export function clearAuditLogForTests() {
  g.__NF3_AUDIT_LOG__ = [];
}
