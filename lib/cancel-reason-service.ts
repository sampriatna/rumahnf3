import { store, nextId, persistStore } from "./store";
import { isPosOutlet } from "./pos-seed";
import { CANCEL_REASON_SEED } from "./cancel-reason-seed";

export type CancelReasonScope = "order" | "item" | "all";

export type CancelReason = {
  id: string;
  outletId: string;
  name: string;
  scope: CancelReasonScope;
  requiresNote: boolean;
  sortOrder: number;
  active: boolean;
};

export type CancelReasonSaveError = "duplicate" | "invalid" | "not-found";

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function ensureCancelReasonsReady(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  const has = store().cancelReasons.some((r) => r.outletId === outletId);
  if (!has) bootstrapCancelReasonsFromSeed(outletId);
}

export function bootstrapCancelReasonsFromSeed(outletId?: string) {
  const rows = outletId
    ? CANCEL_REASON_SEED.filter((r) => r.outletId === outletId)
    : CANCEL_REASON_SEED;

  rows.forEach((row, i) => {
    upsertCancelReason({
      outletId: row.outletId,
      name: row.name,
      scope: row.scope ?? "all",
      requiresNote: row.requiresNote ?? false,
      sortOrder: i + 1,
      active: true
    });
  });
  persistStore();
}

export function resetCancelReasonsFromSeed(outletId: string) {
  store().cancelReasons = store().cancelReasons.filter((r) => r.outletId !== outletId);
  bootstrapCancelReasonsFromSeed(outletId);
}

export function listCancelReasons(
  outletId: string,
  scope?: "order" | "item",
  includeInactive = false
): CancelReason[] {
  ensureCancelReasonsReady(outletId);
  return store()
    .cancelReasons.filter((r) => {
      if (r.outletId !== outletId) return false;
      if (!includeInactive && !r.active) return false;
      if (!scope) return true;
      return r.scope === "all" || r.scope === scope;
    })
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function getCancelReason(outletId: string, id: string) {
  return store().cancelReasons.find((r) => r.outletId === outletId && r.id === id);
}

export function resolveVoidReasonText(
  outletId: string,
  reasonId: string,
  note?: string
): { ok: true; text: string } | { ok: false; error: "required" | "invalid" } {
  const id = reasonId.trim();
  if (!id) return { ok: false, error: "required" };

  const reason = getCancelReason(outletId, id);
  if (!reason || !reason.active) return { ok: false, error: "invalid" };

  const extra = note?.trim();
  if (reason.requiresNote) {
    if (!extra) return { ok: false, error: "required" };
    return { ok: true, text: `${reason.name}: ${extra}` };
  }

  return { ok: true, text: extra ? `${reason.name} — ${extra}` : reason.name };
}

export function upsertCancelReason(input: {
  id?: string;
  outletId: string;
  name: string;
  scope?: CancelReasonScope;
  requiresNote?: boolean;
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; reason: CancelReason }
  | { ok: false; error: CancelReasonSaveError } {
  const name = normalizeName(input.name);
  if (!name) return { ok: false, error: "invalid" };

  const s = store();
  const dup = s.cancelReasons.find(
    (x) =>
      x.outletId === input.outletId &&
      x.id !== input.id &&
      x.name.toLowerCase() === name.toLowerCase()
  );
  if (dup) return { ok: false, error: "duplicate" };

  const existing = input.id ? s.cancelReasons.find((x) => x.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const reason: CancelReason = {
    id: existing?.id ?? nextId("cr"),
    outletId: input.outletId,
    name,
    scope: input.scope ?? existing?.scope ?? "all",
    requiresNote: input.requiresNote ?? existing?.requiresNote ?? false,
    sortOrder:
      input.sortOrder ??
      existing?.sortOrder ??
      s.cancelReasons.filter((x) => x.outletId === input.outletId).length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) Object.assign(existing, reason);
  else s.cancelReasons.push(reason);

  persistStore();
  return { ok: true, reason };
}

export function toggleCancelReasonActive(outletId: string, id: string, active: boolean) {
  const reason = getCancelReason(outletId, id);
  if (!reason) return { ok: false as const, error: "not-found" as const };
  reason.active = active;
  persistStore();
  return { ok: true as const, reason };
}
