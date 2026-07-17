"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { toOutletSlug, outletDisplayName } from "@/lib/outlet-identity";
import { isPosOutlet } from "@/lib/pos-seed";
import { formatKitchenNote } from "@/lib/notes-category-service";
import {
  openShift,
  addToCart,
  addToCartWithModifiers,
  addPackageToCart,
  updateCartQty,
  clearCart,
  createOrderFromCart,
  setOrderCustomer,
  addCartToOpenBill,
  addPayment,
  closeShift,
  getOpenShift,
  getOrder,
  completeZeroOrder,
  holdOrder,
  resumeOrder,
  addOrderDiscount,
  recordCashDrawerEntry,
  splitOrder,
  mergeOrders,
  voidOrderItem,
  moveOrderTable,
  createOnlineOrder,
  recordReprint,
  getMenuItem,
  getModifiersForItem
} from "@/lib/pos-service";
import { getVariant } from "@/lib/variant-service";
import { applyPromotionToOrder } from "@/lib/promotion-service";
import { applyCashierVoucherToOrder } from "@/lib/cashier-voucher-service";
import { onPosOrderCompleted, reverseOrder } from "@/lib/pos-integration";
import { fireKdsTicketsForOrder } from "@/lib/kds-service";
import type { PosOrderChannel, PosPaymentMethod } from "@/lib/pos-kds-roadmap";
import { getPosOutletConfig } from "@/lib/pos-outlet-config";
import { resolveChannel } from "@/lib/channel-service";
import { validatePosOrderContext } from "@/lib/pos-order-validation";
import { resolveWaiterLabel, listPosWaiters } from "@/lib/pos-waiter-service";
import { resolveVoidReasonText } from "@/lib/cancel-reason-service";
import { isValidPosPaymentMethod } from "@/lib/payment-method-service";
import { verifyPosApproverPin } from "@/lib/pos-approver-pin";
import { posLoginUrl, POS_ROLES } from "@/lib/pos-auth";
import { clearSession } from "@/lib/session";
import { canAccessCapability } from "@/lib/staff-capability";
import { requireAuthz } from "@/lib/auth-guard";
import { PHASE0_FLAGS } from "@/lib/phase0-flags";
import { findCustomerByMemberCode } from "@/lib/loyalty-service";
import { addOutletExpense } from "@/lib/pos-outlet-expense";
import { closeStoreDay, openStoreDay } from "@/lib/pos-store-day";
import { processPosSyncQueue } from "@/lib/pos-sync-queue";
import { topUpMemberDeposit } from "@/lib/pos-member-deposit";
import { clockIn, clockOut } from "@/lib/pos-attendance";

function resolveOutletId(session: ReturnType<typeof getSession>, param?: string) {
  if (!session) return null;
  if (param && (session.role === "owner" || session.role === "admin")) return toOutletSlug(param) ?? param;
  return toOutletSlug(session.outletId) ?? toOutletSlug(param) ?? param;
}

function posGuard(session: ReturnType<typeof getSession>, outletId?: string | null) {
  if (PHASE0_FLAGS.authorizationPipeline) {
    const s = requireAuthz({
      capability: "pos",
      outletId,
      redirectTo: posLoginUrl()
    });
    if (!(POS_ROLES as readonly string[]).includes(s.role)) redirect(posLoginUrl());
    const oid = outletId ?? s.outletId;
    if (!oid || !isPosOutlet(oid)) redirect(posLoginUrl());
    return { session: s, outletId: oid };
  }
  if (!session || !(POS_ROLES as readonly string[]).includes(session.role)) redirect(posLoginUrl());
  if (!canAccessCapability(session, "pos")) redirect(posLoginUrl());
  const oid = outletId ?? session.outletId;
  if (!oid || !isPosOutlet(oid)) redirect(posLoginUrl());
  return { session, outletId: oid };
}

export async function posLogoutAction() {
  clearSession();
  redirect("/pos/login");
}

export async function openShiftAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const registerId = String(formData.get("registerId") ?? "");
  const shiftLabel = String(formData.get("shiftLabel") ?? "Pagi");
  const openingFloat = Number(formData.get("openingFloat") ?? 0);

  const result = openShift({
    outletId: oid,
    registerId,
    shiftLabel,
    openingFloat,
    openedBy: s.sub,
    openedByName: s.name
  });

  if (result.error) {
    if (result.error === "Shift masih terbuka." && result.shift) {
      redirect(`/pos?outlet=${oid}`);
    }
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  redirect(`/pos?outlet=${oid}`);
}

export async function addToCartAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const menuItemId = String(formData.get("menuItemId") ?? "");
  addToCart(shiftId, menuItemId, 1);

  revalidatePath("/pos");
  redirect(`/pos?outlet=${oid}`);
}

export async function updateCartQtyAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const lineId = String(formData.get("lineId") ?? formData.get("menuItemId") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  updateCartQty(shiftId, lineId, qty);

  revalidatePath("/pos");
  redirect(`/pos?outlet=${oid}`);
}

export async function addToCartWithModifiersAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const modIds = formData.getAll("modifierId").map(String).filter(Boolean);

  const menu = getMenuItem(menuItemId);
  if (!menu) redirect(`/pos?outlet=${oid}&error=${encodeURIComponent("Menu tidak ditemukan.")}`);
  if (menu.soldOut) redirect(`/pos?outlet=${oid}&error=${encodeURIComponent("Produk habis.")}`);

  const variantId = String(formData.get("variantId") ?? "");
  const variant = variantId ? getVariant(variantId) : undefined;
  if (variantId && (!variant || variant.menuItemId !== menuItemId)) {
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent("Varian tidak valid.")}`);
  }

  const allMods = getModifiersForItem(menuItemId);
  const selected = modIds
    .map((id) => allMods.find((m) => m.id === id))
    .filter(Boolean)
    .map((m) => ({ name: m!.name, priceDelta: m!.priceDelta }));

  const noteNames = formData.getAll("noteName").map(String).filter(Boolean);
  const freeNote = String(formData.get("freeNote") ?? "");
  const kitchenNote = formatKitchenNote(noteNames, freeNote);

  addToCartWithModifiers(
    shiftId,
    menuItemId,
    selected,
    1,
    variant ? { id: variant.id, name: variant.name, price: variant.price } : undefined,
    kitchenNote
  );

  revalidatePath("/pos");
  redirect(`/pos?outlet=${oid}`);
}

export async function addPackageToCartAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const packageId = String(formData.get("packageId") ?? "");
  const cart = addPackageToCart(shiftId, packageId, 1);
  if (!cart) {
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent("Paket tidak tersedia atau ada item habis.")}`);
  }

  revalidatePath("/pos");
  redirect(`/pos?outlet=${oid}`);
}

export async function applyPromotionAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const promoId = String(formData.get("promoId") ?? "");
  const res = applyPromotionToOrder(orderId, promoId);
  if (!res.ok) {
    const msg: Record<string, string> = {
      "not-found": "Promosi tidak ditemukan.",
      inactive: "Promosi tidak aktif atau sudah kadaluarsa.",
      "already-applied": "Bill sudah memakai promosi.",
      "min-subtotal": "Subtotal belum memenuhi syarat promosi.",
      "no-discount": "Tidak ada diskon yang bisa diterapkan."
    };
    redirect(
      `/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent(msg[res.error] ?? "Gagal menerapkan promosi.")}`
    );
  }

  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(`/pos/checkout/${orderId}?outlet=${oid}&ok=promo-applied`);
}

export async function applyCashierVoucherAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  if (!code) {
    redirect(
      `/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent("Kode voucher wajib diisi.")}`
    );
  }

  const res = applyCashierVoucherToOrder(orderId, code, oid);
  if (!res.ok) {
    const msg: Record<string, string> = {
      "not-found": "Kode voucher tidak ditemukan.",
      inactive: "Voucher tidak aktif atau sudah kadaluarsa.",
      expired: "Voucher sudah kadaluarsa.",
      "usage-limit": "Kuota voucher sudah habis.",
      "already-applied": "Bill sudah memakai voucher kasir.",
      "min-subtotal": "Subtotal belum memenuhi syarat voucher.",
      "no-discount": "Tidak ada diskon yang bisa diterapkan."
    };
    redirect(
      `/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent(msg[res.error] ?? "Gagal menerapkan voucher.")}`
    );
  }

  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(`/pos/checkout/${orderId}?outlet=${oid}&ok=voucher-applied`);
}

export async function clearCartAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  clearCart(String(formData.get("shiftId") ?? ""));
  revalidatePath("/pos");
  redirect(`/pos?outlet=${oid}`);
}

export async function createOrderAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const channel = resolveChannel(oid, String(formData.get("channel") ?? "") || undefined);
  const tableLabel = String(formData.get("tableLabel") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const waiterId = String(formData.get("waiterId") ?? "").trim();
  const waiters = await listPosWaiters(oid);
  const waiterName = resolveWaiterLabel(waiters, waiterId);

  const valid = validatePosOrderContext({
    outletId: oid,
    channel,
    tableLabel: tableLabel || undefined
  });
  if (!valid.ok) {
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent(valid.error)}`);
  }

  const order = createOrderFromCart({
    shiftId,
    outletId: oid,
    channel,
    tableLabel: tableLabel || undefined,
    customerName: customerName || undefined,
    waiterId: waiterId || undefined,
    waiterName,
    createdBy: s.name
  });

  if (!order) {
    redirect(`/pos?outlet=${oid}&error=empty-cart`);
  }

  const memberCode = String(formData.get("memberCode") ?? "").trim();
  if (memberCode) {
    const customer = findCustomerByMemberCode(memberCode);
    if (customer) setOrderCustomer(order.id, customer.id, customer.memberCode);
  }

  if (!getPosOutletConfig(oid).openBillMode) {
    fireKdsTicketsForOrder(order, { onlyPending: true });
  }

  revalidatePath("/pos");
  revalidatePath("/kds");
  redirect(`/pos/checkout/${order.id}?outlet=${oid}`);
}

export async function addToOpenBillAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const tableLabel = String(formData.get("tableLabel") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const channel = resolveChannel(oid, String(formData.get("channel") ?? "") || undefined);
  const waiterId = String(formData.get("waiterId") ?? "").trim();
  const waiters = await listPosWaiters(oid);
  const waiterName = resolveWaiterLabel(waiters, waiterId);
  const valid = validatePosOrderContext({
    outletId: oid,
    channel,
    tableLabel: tableLabel || undefined
  });
  if (!valid.ok) {
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent(valid.error)}`);
  }
  const sendKitchen = String(formData.get("sendKitchen") ?? "") === "on";

  const result = addCartToOpenBill({
    shiftId,
    outletId: oid,
    channel,
    tableLabel,
    customerName: customerName || undefined,
    waiterId: waiterId || undefined,
    waiterName,
    createdBy: s.name
  });

  if ("error" in result && result.error) {
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  const memberCode = String(formData.get("memberCode") ?? "").trim();
  if (memberCode && result.order) {
    const customer = findCustomerByMemberCode(memberCode);
    if (customer) setOrderCustomer(result.order.id, customer.id, customer.memberCode);
  }

  if (sendKitchen && result.order) {
    fireKdsTicketsForOrder(result.order, { onlyPending: true });
  }

  revalidatePath("/pos");
  revalidatePath("/kds");
  redirect(`/pos?outlet=${oid}&ok=bill-saved&order=${result.order!.id}`);
}

export async function sendToKitchenAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const order = getOrder(orderId);
  const returnTo = String(formData.get("returnTo") ?? "");
  const back =
    returnTo === "checkout"
      ? `/pos/checkout/${orderId}?outlet=${oid}`
      : `/pos?outlet=${oid}`;

  if (!order || order.status !== "open") {
    redirect(`${back}&error=${encodeURIComponent("Bill tidak ditemukan atau sedang hold.")}`);
  }

  const fired = fireKdsTicketsForOrder(order, { onlyPending: true });
  if (fired.length === 0) {
    redirect(`${back}&error=${encodeURIComponent("Tidak ada item baru untuk dapur.")}`);
  }

  revalidatePath("/pos");
  revalidatePath("/kds");
  redirect(`${back}&ok=kitchen-sent`);
}

export async function addPaymentAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const method = String(formData.get("method") ?? "cash") as PosPaymentMethod;
  if (!isValidPosPaymentMethod(oid, method)) {
    redirect(`/pos/checkout/${orderId}?outlet=${oid}&error=payment-method`);
  }
  const amount = Number(formData.get("amount") ?? 0);
  const reference = String(formData.get("reference") ?? "").trim();
  const outletName = outletDisplayName(oid);

  const result = addPayment({
    orderId,
    method,
    amount,
    reference: reference || undefined,
    createdBy: s.name,
    outletName
  });

  if (!result) redirect(`/pos/checkout/${orderId}?outlet=${oid}&error=payment`);

  if (result.remaining <= 0 && result.order.status === "completed") {
    onPosOrderCompleted(result.order, { createdBy: s.name, outletName });
  }

  revalidatePath("/pos");
  revalidatePath("/kds");
  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath("/members");
  revalidatePath(`/pos/checkout/${orderId}`);

  if (result.remaining <= 0) {
    redirect(`/pos?outlet=${oid}&ok=paid&order=${orderId}`);
  }
  redirect(`/pos/checkout/${orderId}?outlet=${oid}`);
}

export async function closeShiftAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const physicalRaw = String(formData.get("physicalCash") ?? "").trim();
  const physicalCash = physicalRaw ? Number(physicalRaw) : undefined;
  const result = await closeShift({
    shiftId,
    closedBy: s.sub,
    closedByName: s.name,
    userId: s.sub,
    physicalCash: Number.isFinite(physicalCash) ? physicalCash : undefined
  });

  if (result.error) {
    redirect(`/pos/close?outlet=${oid}&shift=${shiftId}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  revalidatePath("/approvals");
  revalidatePath("/staff/status");
  redirect(`/pos?outlet=${oid}&ok=shift-closed&setoran=${result.submission?.id}`);
}

export async function completeZeroOrderAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const outletName = outletDisplayName(oid);
  const order = completeZeroOrder(orderId);
  if (!order) redirect(`/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent("Order belum bisa diselesaikan.")}`);

  onPosOrderCompleted(order!, { createdBy: s.name, outletName });

  revalidatePath("/pos");
  revalidatePath("/kds");
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath("/members");
  redirect(`/pos?outlet=${oid}&ok=paid&order=${orderId}`);
}

export async function holdOrderAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "");
  const back =
    returnTo === "checkout"
      ? `/pos/checkout/${orderId}?outlet=${oid}`
      : `/pos?outlet=${oid}`;

  const result = holdOrder(orderId, reason);
  if (result.error) {
    redirect(`${back}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  redirect(`${back}&ok=held`);
}

export async function resumeOrderAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const result = resumeOrder(orderId);
  if (result.error) {
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  redirect(`/pos?outlet=${oid}&ok=resumed&order=${orderId}`);
}

export async function applyManualDiscountAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const amountRaw = Number(formData.get("amount") ?? 0);
  const percentRaw = Number(formData.get("percent") ?? 0);

  const order = getOrder(orderId);
  if (!order) redirect(`/pos?outlet=${oid}`);

  const pinCheck = await verifyPosApproverPin(oid, pin);
  if (!pinCheck.ok) {
    redirect(
      `/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent(pinCheck.reason)}`
    );
  }

  let amount = amountRaw;
  if (percentRaw > 0) {
    amount = Math.floor(order.subtotal * (percentRaw / 100));
  }
  if (amount <= 0) {
    redirect(
      `/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent("Nominal diskon tidak valid.")}`
    );
  }

  const applied = addOrderDiscount(orderId, amount, "manual", {
    note: note || undefined,
    approvedBy: pinCheck.approverName
  });
  if (!applied) {
    redirect(
      `/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent("Diskon tidak bisa diterapkan.")}`
    );
  }

  revalidatePath("/pos");
  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(`/pos/checkout/${orderId}?outlet=${oid}&ok=discount`);
}

export async function cashDrawerEntryAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const type = String(formData.get("type") ?? "pay_in") as "pay_in" | "pay_out";
  const amount = Number(formData.get("amount") ?? 0);
  const reason = String(formData.get("reason") ?? "").trim();

  const result = recordCashDrawerEntry({
    shiftId,
    type,
    amount,
    reason,
    createdBy: s.name
  });

  if (result.error) {
    redirect(`/pos/drawer?outlet=${oid}&shift=${shiftId}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos/drawer");
  revalidatePath("/pos");
  redirect(`/pos/drawer?outlet=${oid}&shift=${shiftId}&ok=recorded`);
}

const STORE_DAY_ROLES = ["leader", "admin", "owner"];

export async function addOutletExpenseAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const category = String(formData.get("category") ?? "");
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "expenses");

  const result = addOutletExpense({
    shiftId,
    category,
    amount,
    note,
    createdBy: s.name
  });

  const base =
    returnTo === "shift"
      ? `/pos/shift?outlet=${oid}&shift=${shiftId}`
      : `/pos/expenses?outlet=${oid}&shift=${shiftId}`;

  if (result.error) {
    redirect(`${base}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos/shift");
  revalidatePath("/pos/expenses");
  revalidatePath("/pos/drawer");
  revalidatePath("/pos");
  redirect(`${base}&ok=expense-saved`);
}

export async function closeStoreDayAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  if (!STORE_DAY_ROLES.includes(s.role)) {
    redirect(`/pos/shift?outlet=${oid}&error=${encodeURIComponent("Hanya leader/admin yang bisa tutup toko.")}`);
  }

  const result = closeStoreDay({ outletId: oid, closedBy: s.name });
  if (result.error) {
    redirect(`/pos/shift?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  revalidatePath("/pos/shift");
  redirect(`/pos?outlet=${oid}&ok=store-closed`);
}

export async function openStoreDayAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  if (!STORE_DAY_ROLES.includes(s.role)) {
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent("Hanya leader/admin yang bisa buka toko.")}`);
  }

  const result = openStoreDay({ outletId: oid, openedBy: s.name });
  if (result.error) {
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  revalidatePath("/pos/shift");
  redirect(`/pos?outlet=${oid}&ok=store-opened`);
}

export async function splitOrderAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const newTableLabel = String(formData.get("newTableLabel") ?? "").trim();
  const itemIds = formData.getAll("itemId").map(String).filter(Boolean);

  const result = splitOrder({
    orderId,
    itemIds,
    newTableLabel,
    createdBy: s.name
  });

  if ("error" in result && result.error) {
    redirect(`/pos/split/${orderId}?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  revalidatePath("/pos/floor");
  revalidatePath("/kds");
  redirect(
    `/pos?outlet=${oid}&ok=split&order=${result.newOrder!.id}&from=${orderId}`
  );
}

export async function mergeOrdersAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const targetOrderId = String(formData.get("targetOrderId") ?? "");
  const sourceOrderIds = formData.getAll("sourceOrderId").map(String).filter(Boolean);

  const result = mergeOrders({ targetOrderId, sourceOrderIds });
  if ("error" in result && result.error) {
    redirect(`/pos/merge?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  revalidatePath("/pos/floor");
  revalidatePath("/kds");
  redirect(`/pos?outlet=${oid}&ok=merged&order=${targetOrderId}`);
}

const VOID_ROLES = ["leader", "admin", "owner"];

export async function voidOrderAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);
  if (!VOID_ROLES.includes(s.role)) {
    redirect(`/pos?outlet=${oid}&error=${encodeURIComponent("Void hanya untuk leader/admin/owner.")}`);
  }

  const orderId = String(formData.get("orderId") ?? "");
  const reasonId = String(formData.get("reasonId") ?? "");
  const reasonNote = String(formData.get("reasonNote") ?? "").trim();
  const restock = String(formData.get("restock") ?? "") === "on";

  const resolved = resolveVoidReasonText(oid, reasonId, reasonNote);
  if (!resolved.ok) {
    const msg =
      resolved.error === "required" ? "Alasan void wajib dipilih/diisi." : "Alasan void tidak valid.";
    redirect(`/pos/void/${orderId}?outlet=${oid}&error=${encodeURIComponent(msg)}`);
  }
  const reason = resolved.text;

  const order = getOrder(orderId);
  if (!order) redirect(`/pos?outlet=${oid}`);

  const outletName = outletDisplayName(oid);
  const res = reverseOrder(order!, {
    createdBy: s.name,
    outletName,
    reason,
    restock
  });
  if (res.skipped) {
    redirect(`/pos/void/${orderId}?outlet=${oid}&error=${encodeURIComponent(res.reason ?? "Gagal void.")}`);
  }

  revalidatePath("/pos");
  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath("/members");
  revalidatePath("/reports/loyalty");
  redirect(`/pos?outlet=${oid}&ok=voided`);
}

export async function payFullAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const method = String(formData.get("method") ?? "cash") as PosPaymentMethod;
  if (!isValidPosPaymentMethod(oid, method)) {
    redirect(`/pos/checkout/${orderId}?outlet=${oid}&error=payment-method`);
  }
  const order = getOrder(orderId);
  if (!order) redirect(`/pos?outlet=${oid}`);

  const outletName = outletDisplayName(oid);
  const balance = order.total - order.payments.filter((p) => p.status === "captured").reduce((sum, p) => sum + p.amount, 0);

  const result = addPayment({
    orderId,
    method,
    amount: balance,
    createdBy: s.name,
    outletName
  });

  if (result?.order.status === "completed") {
    onPosOrderCompleted(result.order, { createdBy: s.name, outletName });
  }

  revalidatePath("/pos");
  revalidatePath("/kds");
  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  redirect(`/pos?outlet=${oid}&ok=paid&order=${orderId}`);
}

export async function voidOrderItemAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const pin = String(formData.get("pin") ?? "");
  const reasonId = String(formData.get("reasonId") ?? "");
  const reasonNote = String(formData.get("reasonNote") ?? "").trim();

  const pinCheck = await verifyPosApproverPin(oid, pin);
  if (!pinCheck.ok) {
    redirect(
      `/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent(pinCheck.reason)}`
    );
  }

  const resolved = resolveVoidReasonText(oid, reasonId, reasonNote);
  if (!resolved.ok) {
    const msg =
      resolved.error === "required" ? "Alasan void wajib dipilih/diisi." : "Alasan void tidak valid.";
    redirect(`/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent(msg)}`);
  }

  const result = voidOrderItem({
    orderId,
    itemId,
    reason: resolved.text,
    voidedBy: s.name
  });

  if ("error" in result && result.error) {
    redirect(`/pos/checkout/${orderId}?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  revalidatePath("/kds");
  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(`/pos/checkout/${orderId}?outlet=${oid}&ok=item-voided`);
}

export async function moveOrderTableAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  const newTableLabel = String(formData.get("newTableLabel") ?? "").trim();

  const result = moveOrderTable({ orderId, newTableLabel });
  if ("error" in result && result.error) {
    redirect(`/pos/floor?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos");
  revalidatePath("/pos/floor");
  revalidatePath("/kds");
  redirect(`/pos/floor?outlet=${oid}&ok=moved&table=${encodeURIComponent(newTableLabel)}`);
}

export async function createOnlineOrderAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const shiftId = String(formData.get("shiftId") ?? "");
  const platform = String(formData.get("platform") ?? "gofood") as "gofood" | "grab" | "shopee";
  const externalOrderId = String(formData.get("externalOrderId") ?? "").trim();
  const customerName = String(formData.get("customerName") ?? "").trim();
  const menuItemIds = formData.getAll("menuItemId").map(String).filter(Boolean);
  const qtys = formData.getAll("qty").map((q) => Number(q) || 1);

  let items = menuItemIds.map((menuItemId, i) => ({
    menuItemId,
    qty: qtys[i] ?? 1
  }));

  if (items.length === 0) {
    for (const [key, val] of formData.entries()) {
      if (key.startsWith("qty_")) {
        const qty = Number(val) || 0;
        if (qty > 0) {
          items.push({ menuItemId: key.slice(4), qty });
        }
      }
    }
  }

  if (items.length === 0) {
    redirect(`/pos/online?outlet=${oid}&error=${encodeURIComponent("Pilih minimal 1 item (qty > 0).")}`);
  }

  const result = createOnlineOrder({
    shiftId,
    outletId: oid,
    platform,
    externalOrderId,
    customerName: customerName || undefined,
    items,
    createdBy: s.name
  });

  if ("error" in result && result.error) {
    redirect(`/pos/online?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  fireKdsTicketsForOrder(result.order!, { onlyPending: true });

  revalidatePath("/pos");
  revalidatePath("/kds");
  revalidatePath("/pos/online");
  redirect(`/pos/checkout/${result.order!.id}?outlet=${oid}&ok=online-order`);
}

export async function recordReprintAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  posGuard(session, outletId);

  const orderId = String(formData.get("orderId") ?? "");
  recordReprint(orderId, session!.name);
  revalidatePath(`/pos/receipt/${orderId}`);
}

export async function syncPosAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { outletId: oid } = posGuard(session, outletId);

  const result = await processPosSyncQueue(oid);

  revalidatePath("/pos");
  revalidatePath("/pos/sync");
  revalidatePath("/pos/history");
  revalidatePath("/pos/recap");
  revalidatePath("/pos/shift");

  if (result.failed > 0) {
    redirect(
      `/pos/sync?outlet=${oid}&error=${encodeURIComponent(result.error ?? "Sinkronisasi gagal. Coba lagi.")}`
    );
  }

  redirect(`/pos/sync?outlet=${oid}&ok=synced`);
}

const DEPOSIT_ROLES = ["leader", "admin", "owner"];

export async function topUpMemberDepositAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  if (!DEPOSIT_ROLES.includes(s.role)) {
    redirect(`/pos/member-deposit?outlet=${oid}&error=${encodeURIComponent("Hanya leader+ yang bisa top-up deposit.")}`);
  }

  const customerId = String(formData.get("customerId") ?? "");
  const shiftId = String(formData.get("shiftId") ?? "").trim() || undefined;
  const amount = Number(formData.get("amount") ?? 0);
  const note = String(formData.get("note") ?? "").trim();

  const result = topUpMemberDeposit({
    customerId,
    outletId: oid,
    shiftId,
    amount,
    note,
    createdBy: s.name
  });

  if (result.error) {
    redirect(
      `/pos/member-deposit?outlet=${oid}&member=${customerId}&error=${encodeURIComponent(result.error)}`
    );
  }

  revalidatePath("/pos/member-deposit");
  redirect(`/pos/member-deposit?outlet=${oid}&member=${customerId}&ok=deposit-topped`);
}

export async function clockInAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const result = clockIn({
    outletId: oid,
    userId: s.sub,
    userName: s.name,
    userRole: s.role,
    note: String(formData.get("note") ?? "").trim()
  });

  if (result.error) {
    redirect(`/pos/attendance?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos/attendance");
  redirect(`/pos/attendance?outlet=${oid}&ok=clock-in`);
}

export async function clockOutAction(formData: FormData) {
  const session = getSession();
  const outletId = resolveOutletId(session, String(formData.get("outletId") ?? ""));
  const { session: s, outletId: oid } = posGuard(session, outletId);

  const result = clockOut({
    outletId: oid,
    userId: s.sub
  });

  if (result.error) {
    redirect(`/pos/attendance?outlet=${oid}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/pos/attendance");
  redirect(`/pos/attendance?outlet=${oid}&ok=clock-out`);
}
