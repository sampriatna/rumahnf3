import type { PosOrder, PosOrderPayment, PosPaymentMethod } from "./pos-kds-roadmap";
import { recordLedger, addHeldCash, reverseHeldCashForDoc } from "./finance-service";
import {
  resolvePaymentCoaAccount,
  resolveHeldCashConfig,
  paymentMethodDisplayName
} from "./payment-method-service";
import { recordMovement, getItem, listMovementsByDoc } from "./inventory-service";
import { locationLabel } from "./inventory";
import { outletDisplayName } from "./outlet-identity";
import { store } from "./store";
import { seedMenuRecipes, getRecipeForMenuItem, type MenuRecipe } from "./pos-recipes";
import { ensurePosSeeded, getMenuItem } from "./pos-service";
import { earnFromOrder, recordRedemption, reverseLoyaltyForOrder } from "./loyalty-service";
import { recordPosBomToSupabase } from "./pos-bom-supabase";
import { touchOrderSync } from "./pos-sync-queue";
import { releaseCashierVoucherForOrder } from "./cashier-voucher-service";
import { recordAuditEvent } from "./audit-log";

function ensureRecipesSeeded() {
  ensurePosSeeded();
  const s = store();
  if (s.posRecipes.length === 0) {
    s.posRecipes = seedMenuRecipes();
  }
}

/** Catat semua payment order ke ledger (idempotent per payment). */
export function integrateOrderFinance(
  order: PosOrder,
  createdBy: string,
  outletName?: string
) {
  ensureRecipesSeeded();
  const entries = [];

  for (const payment of order.payments.filter((p) => p.status === "captured")) {
    if (payment.ledgerEntryId) continue;

    const entry = recordLedger({
      outletId: order.outletId,
      outletName,
      accountId: resolvePaymentCoaAccount(order.outletId, payment.method) as import("./finance").AccountId,
      transactionType: "in",
      category: "POS Penjualan",
      amount: payment.amount,
      paymentMethod: paymentMethodDisplayName(order.outletId, payment.method),
      sourceDocType: "pos_order",
      sourceDocId: order.id,
      note: `Order ${order.orderNumber}${payment.reference ? ` · ${payment.reference}` : ""}`,
      createdBy
    });
    payment.ledgerEntryId = entry.id;
    entries.push(entry);

    const held = resolveHeldCashConfig(order.outletId, payment.method);
    if (held.enabled) {
      addHeldCash({
        source: held.source,
        amount: payment.amount,
        sourceDocId: order.id,
        releaseDays: held.releaseDays
      });
    }
  }

  return entries;
}

/** Kurangi stok outlet via BOM/resep (idempotent per order). */
export function integrateOrderInventory(order: PosOrder, createdBy: string) {
  ensureRecipesSeeded();
  if (order.inventoryIntegrated) return [];

  const locLabel = locationLabel(order.outletId, outletDisplayName(order.outletId));
  const movements = [];
  const recipes = store().posRecipes;

  for (const line of order.items) {
    if (!line.menuItemId) continue;
    const recipe = getRecipeForMenuItem(line.menuItemId, recipes);
    if (!recipe) continue;

    for (const rl of recipe.lines) {
      const item = getItem(rl.itemId);
      if (!item) continue;

      const qty = rl.qty * line.qty;
      const isReward = Boolean(line.isRewardItem);
      const mov = recordMovement({
        itemId: item.id,
        itemName: item.itemName,
        locationId: order.outletId,
        locationLabel: locLabel,
        movementType: "Stock Out",
        qty,
        unit: rl.unit,
        sourceDocType: isReward ? "loyalty_redemption" : "pos_order",
        sourceDocId: order.id,
        note: `POS ${order.orderNumber} · ${line.nameSnapshot}${isReward ? " · REWARD" : ""}`,
        createdBy,
        delta: -qty
      });
      movements.push(mov);
    }
    if (line.isRewardItem) line.stockDeductedStatus = "deducted";
  }

  order.inventoryIntegrated = true;
  void recordPosBomToSupabase(order, createdBy);
  return movements;
}

/**
 * Loyalty saat order lunas: snapshot gross/net, catat promo cost item gratis
 * (NON-KAS, untuk report), lalu earn poin + stamp. Idempotent via loyaltyEarned.
 */
export function integrateOrderLoyalty(order: PosOrder, createdBy: string) {
  if (order.loyaltyEarned) return { skipped: true, pointsEarned: 0, stampsEarned: 0 };

  order.totalGross = order.items.reduce(
    (s, it) => s + (it.isRewardItem ? (it.normalPrice ?? 0) : it.unitPrice) * it.qty,
    0
  );
  order.totalNet = order.total;
  order.totalDiscount =
    (order.totalLoyaltyDiscount ?? 0) + (order.totalVoucherDiscount ?? 0);

  if (order.customerId) {
    for (const line of order.items.filter((l) => l.isRewardItem)) {
      recordRedemption({
        customerId: order.customerId,
        orderId: order.id,
        voucherId: line.rewardVoucherId,
        rewardType: "free_item",
        rewardValue: line.normalPrice ?? 0,
        normalPrice: line.normalPrice ?? 0,
        promoCost: line.normalPrice ?? 0,
        redeemedBy: createdBy,
        outletId: order.outletId
      });
    }
  }

  const res = earnFromOrder(
    {
      id: order.id,
      outletId: order.outletId,
      customerId: order.customerId,
      totalNet: order.totalNet ?? order.total,
      items: order.items.map((l) => ({
        menuItemId: l.menuItemId,
        qty: l.qty,
        isRewardItem: l.isRewardItem
      })),
      loyaltyEarned: false
    },
    { createdBy, menuCategory: (id) => getMenuItem(id)?.categoryId }
  );

  order.pointsEarned = res.pointsEarned;
  order.stampsEarned = res.stampsEarned;
  order.loyaltyEarned = true;
  if (!order.rewardRedeemedStatus || order.rewardRedeemedStatus === "none") {
    order.rewardRedeemedStatus = res.pointsEarned || res.stampsEarned ? "earned" : "none";
  }
  return { skipped: false, ...res };
}

/** Hook lengkap saat order POS lunas: finance + stok + loyalty (KDS sudah di-fire sebelum bayar). */
export function onPosOrderCompleted(
  order: PosOrder,
  ctx: { createdBy: string; outletName?: string }
) {
  if (order.status !== "completed") return { skipped: true };

  if (!order.integratedAt) {
    integrateOrderFinance(order, ctx.createdBy, ctx.outletName);
    integrateOrderInventory(order, ctx.createdBy);
    integrateOrderLoyalty(order, ctx.createdBy);
    order.integratedAt = new Date().toISOString();
  }

  return {
    skipped: false,
    financePosted: order.payments.every(
      (p) => p.status !== "captured" || Boolean(p.ledgerEntryId)
    ),
    inventoryPosted: Boolean(order.inventoryIntegrated),
    loyaltyPosted: Boolean(order.loyaltyEarned)
  };
}

/**
 * Void / refund order yang sudah completed:
 *  - Finance: contra ledger (kas keluar refund) + batalkan kas tertahan
 *  - Inventory: restock opsional (kalau item belum dibuat)
 *  - Loyalty: balik poin/stamp, kembalikan voucher
 */
export function reverseOrder(
  order: PosOrder,
  ctx: { createdBy: string; outletName?: string; reason: string; restock: boolean }
) {
  if (order.status === "void") return { skipped: true, reason: "Sudah void." };
  if (order.status !== "completed") return { skipped: true, reason: "Hanya order lunas yang bisa di-void." };

  // 1. Finance — contra entry per payment captured
  for (const payment of order.payments.filter((p) => p.status === "captured")) {
    recordLedger({
      outletId: order.outletId,
      outletName: ctx.outletName,
      accountId: resolvePaymentCoaAccount(order.outletId, payment.method) as import("./finance").AccountId,
      transactionType: "out",
      category: "Refund/Void POS",
      amount: payment.amount,
      paymentMethod: paymentMethodDisplayName(order.outletId, payment.method),
      sourceDocType: "pos_void",
      sourceDocId: order.id,
      note: `Void ${order.orderNumber} · ${ctx.reason}`,
      createdBy: ctx.createdBy
    });
  }
  reverseHeldCashForDoc(order.id);

  // 2. Inventory — restock balik (opsional)
  if (ctx.restock) {
    const outMovements = listMovementsByDoc(order.id).filter((m) => m.movementType === "Stock Out");
    for (const m of outMovements) {
      recordMovement({
        itemId: m.itemId,
        itemName: m.itemName,
        locationId: m.locationId,
        locationLabel: m.locationLabel,
        movementType: "Stock In",
        qty: m.qty,
        unit: m.unit,
        sourceDocType: "pos_void",
        sourceDocId: order.id,
        note: `Void ${order.orderNumber} · restock`,
        createdBy: ctx.createdBy,
        delta: m.qty
      });
    }
  }

  // 3. Loyalty reversal
  reverseLoyaltyForOrder(order, ctx.createdBy);
  order.loyaltyReversed = true;

  releaseCashierVoucherForOrder(order);

  // 4. Tandai order void
  order.status = "void";
  order.voidReason = ctx.reason;
  order.voidedAt = new Date().toISOString();
  order.voidedBy = ctx.createdBy;
  order.rewardRedeemedStatus = "none";

  touchOrderSync(order, "update");

  recordAuditEvent({
    action: "pos.void_order",
    actorName: ctx.createdBy,
    outletId: order.outletId,
    entityType: "pos_order",
    entityId: order.id,
    reason: ctx.reason,
    meta: { restock: ctx.restock, orderNumber: order.orderNumber }
  });

  return { skipped: false };
}

export function listPosRecipes(): MenuRecipe[] {
  ensureRecipesSeeded();
  return store().posRecipes;
}

export { ensureRecipesSeeded };
