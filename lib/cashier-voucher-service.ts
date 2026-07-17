import { store, nextId, persistStore } from "./store";
import { isPosOutlet } from "./pos-seed";
import { CASHIER_VOUCHER_SEED } from "./cashier-voucher-seed";
import type { PosOrder } from "./pos-kds-roadmap";
import { addOrderDiscount, getOrder } from "./pos-service";

export type CashierVoucherType = "fixed" | "percent";

export type CashierVoucher = {
  id: string;
  outletId: string;
  name: string;
  code: string;
  voucherType: CashierVoucherType;
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom?: string;
  validTo?: string;
  sortOrder: number;
  active: boolean;
};

export type CashierVoucherSaveError = "duplicate" | "invalid" | "not-found" | "duplicate-code";

export type CashierVoucherApplyError =
  | "not-found"
  | "inactive"
  | "expired"
  | "min-subtotal"
  | "usage-limit"
  | "already-applied"
  | "no-discount";

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function dayStart(iso?: string) {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isCashierVoucherActive(voucher: CashierVoucher, now = new Date()) {
  if (!voucher.active) return false;
  if (voucher.usageLimit != null && voucher.usedCount >= voucher.usageLimit) return false;
  const from = dayStart(voucher.validFrom);
  const to = dayStart(voucher.validTo);
  if (from && now < from) return false;
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}

export function ensureCashierVouchersReady(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  const has = store().cashierVouchers.some((v) => v.outletId === outletId);
  if (!has) bootstrapCashierVouchersFromSeed(outletId);
}

export function bootstrapCashierVouchersFromSeed(outletId?: string) {
  const rows = outletId
    ? CASHIER_VOUCHER_SEED.filter((r) => r.outletId === outletId)
    : CASHIER_VOUCHER_SEED;
  rows.forEach((row, i) => {
    upsertCashierVoucher({
      outletId: row.outletId,
      name: row.name,
      code: row.code,
      voucherType: row.voucherType,
      value: row.value,
      minSubtotal: row.minSubtotal,
      maxDiscount: row.maxDiscount,
      usageLimit: row.usageLimit,
      sortOrder: i + 1,
      active: true
    });
  });
  persistStore();
}

export function resetCashierVouchersFromSeed(outletId: string) {
  store().cashierVouchers = store().cashierVouchers.filter((v) => v.outletId !== outletId);
  bootstrapCashierVouchersFromSeed(outletId);
}

export function listCashierVouchers(outletId: string, includeInactive = false): CashierVoucher[] {
  ensureCashierVouchersReady(outletId);
  return store()
    .cashierVouchers.filter((v) => v.outletId === outletId && (includeInactive || v.active))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function listActiveCashierVouchers(outletId: string, now = new Date()) {
  return listCashierVouchers(outletId).filter((v) => isCashierVoucherActive(v, now));
}

export function getCashierVoucher(id: string) {
  return store().cashierVouchers.find((v) => v.id === id);
}

export function findCashierVoucherByCode(outletId: string, code: string) {
  const key = code.trim().toUpperCase();
  if (!key) return undefined;
  ensureCashierVouchersReady(outletId);
  return store().cashierVouchers.find(
    (v) => v.outletId === outletId && v.code.toUpperCase() === key
  );
}

export function upsertCashierVoucher(input: {
  id?: string;
  outletId: string;
  name: string;
  code: string;
  voucherType: CashierVoucherType;
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount?: number;
  validFrom?: string;
  validTo?: string;
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; voucher: CashierVoucher }
  | { ok: false; error: CashierVoucherSaveError } {
  const name = normalizeName(input.name);
  const code = input.code.trim().toUpperCase();
  if (!name || !code || input.value < 0) return { ok: false, error: "invalid" };
  if (input.voucherType === "percent" && input.value > 100) return { ok: false, error: "invalid" };

  const s = store();
  const dupName = s.cashierVouchers.find(
    (v) =>
      v.outletId === input.outletId &&
      v.id !== input.id &&
      v.name.toLowerCase() === name.toLowerCase()
  );
  if (dupName) return { ok: false, error: "duplicate" };

  const dupCode = s.cashierVouchers.find(
    (v) => v.outletId === input.outletId && v.id !== input.id && v.code.toUpperCase() === code
  );
  if (dupCode) return { ok: false, error: "duplicate-code" };

  const existing = input.id ? s.cashierVouchers.find((v) => v.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const voucher: CashierVoucher = {
    id: existing?.id ?? nextId("cv"),
    outletId: input.outletId,
    name,
    code,
    voucherType: input.voucherType,
    value: input.value,
    minSubtotal: input.minSubtotal,
    maxDiscount: input.maxDiscount,
    usageLimit: input.usageLimit,
    usedCount: input.usedCount ?? existing?.usedCount ?? 0,
    validFrom: input.validFrom?.trim() || undefined,
    validTo: input.validTo?.trim() || undefined,
    sortOrder:
      input.sortOrder ??
      existing?.sortOrder ??
      s.cashierVouchers.filter((v) => v.outletId === input.outletId).length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) Object.assign(existing, voucher);
  else s.cashierVouchers.push(voucher);

  persistStore();
  return { ok: true, voucher };
}

export function toggleCashierVoucherActive(id: string, active: boolean) {
  const voucher = getCashierVoucher(id);
  if (!voucher) return { ok: false as const, error: "not-found" as const };
  voucher.active = active;
  persistStore();
  return { ok: true as const, voucher };
}

export function calcCashierVoucherDiscount(order: PosOrder, voucher: CashierVoucher): number {
  const activeItems = order.items.filter((it) => it.status !== "void");
  const subtotal = activeItems.reduce((s, it) => s + it.lineTotal, 0);
  if (voucher.minSubtotal && subtotal < voucher.minSubtotal) return 0;

  let amount = 0;
  if (voucher.voucherType === "fixed") {
    amount = Math.min(voucher.value, subtotal);
  } else {
    amount = Math.floor((subtotal * voucher.value) / 100);
    if (voucher.maxDiscount) amount = Math.min(amount, voucher.maxDiscount);
    amount = Math.min(amount, subtotal);
  }
  return amount;
}

export function applyCashierVoucherToOrder(
  orderId: string,
  code: string,
  outletId: string,
  now = new Date()
) {
  const voucher = findCashierVoucherByCode(outletId, code);
  if (!voucher) return { ok: false as const, error: "not-found" as const };
  if (!isCashierVoucherActive(voucher, now)) {
    return {
      ok: false as const,
      error: voucher.usageLimit != null && voucher.usedCount >= voucher.usageLimit
        ? ("usage-limit" as const)
        : ("inactive" as const)
    };
  }

  const order = getOrder(orderId);
  if (!order) return { ok: false as const, error: "not-found" as const };
  if (order.appliedCashierVoucherId) return { ok: false as const, error: "already-applied" as const };

  const amount = calcCashierVoucherDiscount(order, voucher);
  if (amount <= 0) {
    return {
      ok: false as const,
      error: voucher.minSubtotal ? ("min-subtotal" as const) : ("no-discount" as const)
    };
  }

  const res = addOrderDiscount(orderId, amount, "cashier_voucher");
  if (!res) return { ok: false as const, error: "no-discount" as const };

  order.appliedCashierVoucherId = voucher.id;
  order.appliedCashierVoucherCode = voucher.code;
  order.appliedCashierVoucherName = voucher.name;
  voucher.usedCount += 1;
  persistStore();
  return { ok: true as const, applied: res.applied, voucher };
}

export function releaseCashierVoucherForOrder(order: PosOrder) {
  if (!order.appliedCashierVoucherId) return;
  const voucher = getCashierVoucher(order.appliedCashierVoucherId);
  if (voucher && voucher.usedCount > 0) voucher.usedCount -= 1;
  order.appliedCashierVoucherId = undefined;
  order.appliedCashierVoucherCode = undefined;
  order.appliedCashierVoucherName = undefined;
  persistStore();
}
