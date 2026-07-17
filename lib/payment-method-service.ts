import type { PosPaymentMethod } from "./pos-kds-roadmap";
import { PAYMENT_TO_ACCOUNT } from "./pos-kds-roadmap";
import { store, persistStore } from "./store";
import { isPosOutlet } from "./pos-seed";
import { PAYMENT_METHOD_SEED } from "./payment-method-seed";
import { ensureCoaReady, getChartOfAccount } from "./coa-service";

export type PaymentMethodKind = "cash" | "card" | "ewallet" | "platform" | "transfer" | "other";
export type PaymentShiftBucket = "cash" | "qris" | "online" | "bank";

export type PosPaymentMethodMaster = {
  id: string;
  outletId: string;
  name: string;
  kind: PaymentMethodKind;
  coaAccountId: string;
  shiftBucket: PaymentShiftBucket;
  heldCashEnabled: boolean;
  heldCashSource?: string;
  heldCashReleaseDays?: number;
  sortOrder: number;
  active: boolean;
};

export type PaymentMethodSaveError = "duplicate" | "invalid" | "not-found" | "coa";

function slugify(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
}

export function ensurePaymentMethodsReady(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  ensureCoaReady();
  const has = store().posPaymentMethods.some((m) => m.outletId === outletId);
  if (!has) bootstrapPaymentMethodsFromSeed(outletId);
}

export function bootstrapPaymentMethodsFromSeed(outletId?: string) {
  ensureCoaReady();
  const rows = outletId
    ? PAYMENT_METHOD_SEED.filter((r) => r.outletId === outletId)
    : PAYMENT_METHOD_SEED;

  rows.forEach((row, i) => {
    upsertPosPaymentMethod({
      outletId: row.outletId,
      id: row.id,
      name: row.name,
      kind: row.kind,
      coaAccountId: row.coaAccountId,
      shiftBucket: row.shiftBucket,
      heldCashEnabled: row.heldCashEnabled ?? false,
      heldCashSource: row.heldCashSource,
      heldCashReleaseDays: row.heldCashReleaseDays,
      sortOrder: i + 1,
      active: true
    });
  });
  persistStore();
}

export function resetPaymentMethodsFromSeed(outletId: string) {
  store().posPaymentMethods = store().posPaymentMethods.filter((m) => m.outletId !== outletId);
  bootstrapPaymentMethodsFromSeed(outletId);
}

export function listPosPaymentMethods(outletId: string, includeInactive = false): PosPaymentMethodMaster[] {
  ensurePaymentMethodsReady(outletId);
  return store()
    .posPaymentMethods.filter((m) => m.outletId === outletId && (includeInactive || m.active))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function getPosPaymentMethod(outletId: string, id: string) {
  return store().posPaymentMethods.find((m) => m.outletId === outletId && m.id === id);
}

export function isValidPosPaymentMethod(outletId: string, id: string): boolean {
  ensurePaymentMethodsReady(outletId);
  const method = getPosPaymentMethod(outletId, id);
  return Boolean(method?.active);
}

export function resolvePaymentCoaAccount(outletId: string, method: PosPaymentMethod): string {
  const master = getPosPaymentMethod(outletId, method);
  if (master?.coaAccountId) return master.coaAccountId;
  return PAYMENT_TO_ACCOUNT[method] ?? "bank";
}

export function resolveShiftBucket(
  outletId: string,
  method: PosPaymentMethod
): "cash" | "qris" | "online" {
  const master = getPosPaymentMethod(outletId, method);
  if (master) {
    if (master.shiftBucket === "qris") return "qris";
    if (master.shiftBucket === "online") return "online";
    return "cash";
  }
  if (method === "cash") return "cash";
  if (method === "qris") return "qris";
  if (method === "gofood" || method === "grab" || method === "shopee") return "online";
  return "cash";
}

export function resolveHeldCashConfig(outletId: string, method: PosPaymentMethod) {
  const master = getPosPaymentMethod(outletId, method);
  if (master?.heldCashEnabled) {
    return {
      enabled: true,
      source: master.heldCashSource ?? master.name,
      releaseDays: master.heldCashReleaseDays ?? 1
    };
  }
  if (method === "qris") return { enabled: true, source: "QRIS", releaseDays: 1 };
  if (method === "shopee") return { enabled: true, source: "Marketplace", releaseDays: 2 };
  if (method === "gofood" || method === "grab") {
    return { enabled: true, source: "GoFood/Grab/Shopee", releaseDays: 3 };
  }
  return { enabled: false as const };
}

export function paymentMethodDisplayName(outletId: string, method: PosPaymentMethod): string {
  return getPosPaymentMethod(outletId, method)?.name ?? method;
}

export function upsertPosPaymentMethod(input: {
  outletId: string;
  id?: string;
  name: string;
  kind?: PaymentMethodKind;
  coaAccountId: string;
  shiftBucket?: PaymentShiftBucket;
  heldCashEnabled?: boolean;
  heldCashSource?: string;
  heldCashReleaseDays?: number;
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; method: PosPaymentMethodMaster }
  | { ok: false; error: PaymentMethodSaveError } {
  ensureCoaReady();
  const name = input.name.trim();
  if (!name) return { ok: false, error: "invalid" };

  const id = slugify(input.id ?? name);
  if (!id) return { ok: false, error: "invalid" };

  if (!getChartOfAccount(input.coaAccountId)) return { ok: false, error: "coa" };

  const s = store();
  const existing = s.posPaymentMethods.find((m) => m.outletId === input.outletId && m.id === id);

  const kind = input.kind ?? existing?.kind ?? "other";
  const shiftBucket = input.shiftBucket ?? existing?.shiftBucket ?? "cash";

  const method: PosPaymentMethodMaster = {
    id,
    outletId: input.outletId,
    name,
    kind,
    coaAccountId: input.coaAccountId,
    shiftBucket,
    heldCashEnabled: input.heldCashEnabled ?? existing?.heldCashEnabled ?? false,
    heldCashSource: input.heldCashSource ?? existing?.heldCashSource,
    heldCashReleaseDays: input.heldCashReleaseDays ?? existing?.heldCashReleaseDays,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? s.posPaymentMethods.length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) {
    Object.assign(existing, method);
  } else {
    s.posPaymentMethods.push(method);
  }

  persistStore();
  return { ok: true, method };
}

export function togglePosPaymentMethodActive(outletId: string, id: string, active: boolean) {
  const method = getPosPaymentMethod(outletId, id);
  if (!method) return { ok: false as const, error: "not-found" as const };
  method.active = active;
  persistStore();
  return { ok: true as const };
}
