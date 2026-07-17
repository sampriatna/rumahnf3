import { store, nextId, persistStore } from "./store";

import { isPosOutlet } from "./pos-seed";

import { PROMOTION_SEED } from "./promotion-seed";

import type { PosOrder } from "./pos-kds-roadmap";

import { addOrderDiscount, getOrder } from "./pos-service";



export type PromoType = "order_percent" | "order_fixed" | "item_percent";



export type PosPromotion = {

  id: string;

  outletId: string;

  name: string;

  code?: string;

  promoType: PromoType;

  value: number;

  targetMenuItemIds: string[];

  minSubtotal?: number;

  validFrom?: string;

  validTo?: string;

  sortOrder: number;

  active: boolean;

};



export type PromoSaveError = "duplicate" | "invalid" | "not-found";



export type PromoApplyError =

  | "not-found"

  | "inactive"

  | "expired"

  | "min-subtotal"

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



export function isPromotionActive(promo: PosPromotion, now = new Date()) {

  if (!promo.active) return false;

  const from = dayStart(promo.validFrom);

  const to = dayStart(promo.validTo);

  if (from && now < from) return false;

  if (to) {

    const end = new Date(to);

    end.setHours(23, 59, 59, 999);

    if (now > end) return false;

  }

  return true;

}



export function ensurePromotionsReady(outletId: string) {

  if (!isPosOutlet(outletId)) return;

  const has = store().posPromotions.some((p) => p.outletId === outletId);

  if (!has) bootstrapPromotionsFromSeed(outletId);

}



export function bootstrapPromotionsFromSeed(outletId?: string) {

  const rows = outletId ? PROMOTION_SEED.filter((r) => r.outletId === outletId) : PROMOTION_SEED;

  rows.forEach((row, i) => {

    upsertPromotion({

      outletId: row.outletId,

      name: row.name,

      code: row.code,

      promoType: row.promoType,

      value: row.value,

      targetMenuItemIds: row.targetMenuItemIds ?? [],

      minSubtotal: row.minSubtotal,

      sortOrder: i + 1,

      active: true

    });

  });

  persistStore();

}



export function resetPromotionsFromSeed(outletId: string) {

  store().posPromotions = store().posPromotions.filter((p) => p.outletId !== outletId);

  bootstrapPromotionsFromSeed(outletId);

}



export function listPromotions(outletId: string, includeInactive = false): PosPromotion[] {

  ensurePromotionsReady(outletId);

  return store()

    .posPromotions.filter((p) => p.outletId === outletId && (includeInactive || p.active))

    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));

}



export function listActivePromotions(outletId: string, now = new Date()) {

  return listPromotions(outletId).filter((p) => isPromotionActive(p, now));

}



export function getPromotion(id: string) {

  return store().posPromotions.find((p) => p.id === id);

}



export function findPromotionByCode(outletId: string, code: string) {

  const key = code.trim().toUpperCase();

  if (!key) return undefined;

  return listPromotions(outletId).find((p) => p.code?.toUpperCase() === key);

}



export function upsertPromotion(input: {

  id?: string;

  outletId: string;

  name: string;

  code?: string;

  promoType: PromoType;

  value: number;

  targetMenuItemIds?: string[];

  minSubtotal?: number;

  validFrom?: string;

  validTo?: string;

  sortOrder?: number;

  active?: boolean;

}):

  | { ok: true; promo: PosPromotion }

  | { ok: false; error: PromoSaveError } {

  const name = normalizeName(input.name);

  if (!name || input.value < 0) return { ok: false, error: "invalid" };

  if (input.promoType === "order_percent" || input.promoType === "item_percent") {

    if (input.value > 100) return { ok: false, error: "invalid" };

  }



  const s = store();

  const dup = s.posPromotions.find(

    (p) => p.outletId === input.outletId && p.id !== input.id && p.name.toLowerCase() === name.toLowerCase()

  );

  if (dup) return { ok: false, error: "duplicate" };



  const existing = input.id ? s.posPromotions.find((p) => p.id === input.id) : undefined;

  if (input.id && !existing) return { ok: false, error: "not-found" };



  const promo: PosPromotion = {

    id: existing?.id ?? nextId("prm"),

    outletId: input.outletId,

    name,

    code: input.code?.trim().toUpperCase() || undefined,

    promoType: input.promoType,

    value: input.value,

    targetMenuItemIds: input.targetMenuItemIds ?? existing?.targetMenuItemIds ?? [],

    minSubtotal: input.minSubtotal,

    validFrom: input.validFrom?.trim() || undefined,

    validTo: input.validTo?.trim() || undefined,

    sortOrder:

      input.sortOrder ??

      existing?.sortOrder ??

      s.posPromotions.filter((p) => p.outletId === input.outletId).length + 1,

    active: input.active ?? existing?.active ?? true

  };



  if (existing) Object.assign(existing, promo);

  else s.posPromotions.push(promo);



  persistStore();

  return { ok: true, promo };

}



export function togglePromotionActive(id: string, active: boolean) {

  const promo = getPromotion(id);

  if (!promo) return { ok: false as const, error: "not-found" as const };

  promo.active = active;

  persistStore();

  return { ok: true as const, promo };

}



export function calcPromotionDiscount(order: PosOrder, promo: PosPromotion): number {

  const activeItems = order.items.filter((it) => it.status !== "void");

  const subtotal = activeItems.reduce((s, it) => s + it.lineTotal, 0);

  if (promo.minSubtotal && subtotal < promo.minSubtotal) return 0;



  if (promo.promoType === "order_percent") {

    return Math.floor((subtotal * promo.value) / 100);

  }

  if (promo.promoType === "order_fixed") {

    return Math.min(promo.value, subtotal);

  }

  if (promo.promoType === "item_percent") {

    const targets = new Set(promo.targetMenuItemIds);

    const eligible = activeItems

      .filter((it) => it.menuItemId && targets.has(it.menuItemId))

      .reduce((s, it) => s + it.lineTotal, 0);

    return Math.floor((eligible * promo.value) / 100);

  }

  return 0;

}



export function applyPromotionToOrder(orderId: string, promoId: string, now = new Date()) {

  const promo = getPromotion(promoId);

  if (!promo) return { ok: false as const, error: "not-found" as const };

  if (!isPromotionActive(promo, now)) return { ok: false as const, error: "inactive" as const };



  const order = getOrder(orderId);

  if (!order) return { ok: false as const, error: "not-found" as const };

  if (order.appliedPromotionId) return { ok: false as const, error: "already-applied" as const };



  const amount = calcPromotionDiscount(order, promo);

  if (amount <= 0) {

    return { ok: false as const, error: promo.minSubtotal ? "min-subtotal" as const : "no-discount" as const };

  }



  const res = addOrderDiscount(orderId, amount, "manual", { note: `Promo: ${promo.name}` });

  if (!res) return { ok: false as const, error: "no-discount" as const };



  order.appliedPromotionId = promo.id;

  order.appliedPromotionName = promo.name;

  persistStore();

  return { ok: true as const, applied: res.applied, promo };

}

