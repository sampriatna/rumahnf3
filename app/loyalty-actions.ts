"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  getOrder,
  setOrderCustomer,
  clearOrderCustomer,
  addOrderDiscount,
  addRewardItemToOrder
} from "@/lib/pos-service";
import {
  createCustomer,
  getCustomer,
  getVoucher,
  useVoucher as redeemVoucher,
  redeemPoints,
  createManualVoucher,
  generateBirthdayVouchers,
  generateWinbackVouchers,
  adjustPoints,
  tierDiscountFor,
  ensureLoyaltyReady
} from "@/lib/loyalty-service";

const POS_ROLES = ["staff", "leader", "admin", "owner"];
const ADMIN_ROLES = ["admin", "owner"];

async function withLoyaltyReady() {
  await ensureLoyaltyReady();
}

function checkoutUrl(orderId: string, outletId: string, msg?: string) {
  const q = msg ? `&error=${encodeURIComponent(msg)}` : "";
  return `/pos/checkout/${orderId}?outlet=${outletId}${q}`;
}

export async function attachMemberAction(formData: FormData) {
  await withLoyaltyReady();
  const session = getSession();
  if (!session || !POS_ROLES.includes(session.role)) redirect("/dashboard");

  const orderId = String(formData.get("orderId") ?? "");
  const outletId = String(formData.get("outletId") ?? "");
  const customerId = String(formData.get("customerId") ?? "");

  const customer = getCustomer(customerId);
  if (customer) setOrderCustomer(orderId, customer.id, customer.memberCode);

  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(checkoutUrl(orderId, outletId));
}

export async function removeMemberAction(formData: FormData) {
  const session = getSession();
  if (!session || !POS_ROLES.includes(session.role)) redirect("/dashboard");

  const orderId = String(formData.get("orderId") ?? "");
  const outletId = String(formData.get("outletId") ?? "");
  clearOrderCustomer(orderId);

  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(checkoutUrl(orderId, outletId));
}

export async function quickRegisterAction(formData: FormData) {
  const session = getSession();
  if (!session || !POS_ROLES.includes(session.role)) redirect("/dashboard");

  const orderId = String(formData.get("orderId") ?? "");
  const outletId = String(formData.get("outletId") ?? "");
  const fullName = String(formData.get("fullName") ?? "");
  const phone = String(formData.get("phone") ?? "");

  const res = createCustomer({ fullName, phone, registeredOutletId: outletId });
  if (res.error) redirect(checkoutUrl(orderId, outletId, res.error));
  if (res.customer) setOrderCustomer(orderId, res.customer.id, res.customer.memberCode);

  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(checkoutUrl(orderId, outletId));
}

export async function applyVoucherAction(formData: FormData) {
  const session = getSession();
  if (!session || !POS_ROLES.includes(session.role)) redirect("/dashboard");

  const orderId = String(formData.get("orderId") ?? "");
  const outletId = String(formData.get("outletId") ?? "");
  const voucherId = String(formData.get("voucherId") ?? "");

  const order = getOrder(orderId);
  const voucher = getVoucher(voucherId);
  if (!order || !voucher) redirect(checkoutUrl(orderId, outletId, "Voucher tidak valid."));
  if (order!.customerId !== voucher!.customerId) {
    redirect(checkoutUrl(orderId, outletId, "Voucher bukan milik member ini."));
  }

  const used = redeemVoucher({
    voucherId,
    orderId,
    outletId,
    orderSubtotal: order!.subtotal,
    createdBy: session.name
  });
  if (used.error) redirect(checkoutUrl(orderId, outletId, used.error));

  if (voucher!.type === "free_item" && voucher!.rewardMenuId) {
    addRewardItemToOrder({
      orderId,
      menuItemId: voucher!.rewardMenuId,
      voucherId,
      programId: voucher!.programId
    });
  } else if (voucher!.type === "discount_amount" && voucher!.discountAmount) {
    addOrderDiscount(orderId, voucher!.discountAmount, "voucher");
  }

  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(checkoutUrl(orderId, outletId));
}

export async function applyTierDiscountAction(formData: FormData) {
  const session = getSession();
  if (!session || !POS_ROLES.includes(session.role)) redirect("/dashboard");

  const orderId = String(formData.get("orderId") ?? "");
  const outletId = String(formData.get("outletId") ?? "");

  const order = getOrder(orderId);
  if (!order || !order.customerId) {
    redirect(checkoutUrl(orderId, outletId, "Pilih member dulu."));
  }
  const { tier, amount } = tierDiscountFor(order!.customerId!, order!.subtotal);
  if (!tier || amount <= 0) {
    redirect(checkoutUrl(orderId, outletId, "Member tidak punya diskon tier."));
  }
  addOrderDiscount(orderId, amount, "loyalty");
  order!.loyaltyProgramApplied = `Tier ${tier!.name} ${tier!.discountPercent}%`;

  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(checkoutUrl(orderId, outletId));
}

export async function redeemPointsAction(formData: FormData) {
  const session = getSession();
  if (!session || !POS_ROLES.includes(session.role)) redirect("/dashboard");

  const orderId = String(formData.get("orderId") ?? "");
  const outletId = String(formData.get("outletId") ?? "");
  const points = Number(formData.get("points") ?? 0);

  const order = getOrder(orderId);
  if (!order || !order.customerId) {
    redirect(checkoutUrl(orderId, outletId, "Pilih member dulu."));
  }

  const res = redeemPoints({
    customerId: order!.customerId!,
    orderId,
    points,
    outletId,
    createdBy: session.name
  });
  if (res.error) redirect(checkoutUrl(orderId, outletId, res.error));

  if (res.discount) {
    addOrderDiscount(orderId, res.discount, "loyalty");
    order!.pointsRedeemed = (order!.pointsRedeemed ?? 0) + points;
  }

  revalidatePath(`/pos/checkout/${orderId}`);
  redirect(checkoutUrl(orderId, outletId));
}

// ---- Halaman member (admin/owner) ----

export async function createMemberAction(formData: FormData) {
  await withLoyaltyReady();
  const session = getSession();
  if (!session || !POS_ROLES.includes(session.role)) redirect("/dashboard");

  const fullName = String(formData.get("fullName") ?? "");
  const phone = String(formData.get("phone") ?? "");
  const birthDate = String(formData.get("birthDate") ?? "").trim();
  const outletId = session.outletId ?? String(formData.get("outletId") ?? "");

  const res = createCustomer({
    fullName,
    phone,
    birthDate: birthDate || undefined,
    registeredOutletId: outletId || undefined
  });

  revalidatePath("/members");
  if (res.error) redirect(`/members?error=${encodeURIComponent(res.error)}`);
  redirect(`/members?ok=created`);
}

export async function createVoucherAction(formData: FormData) {
  const session = getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/dashboard");

  const customerId = String(formData.get("customerId") ?? "");
  const type = String(formData.get("type") ?? "discount_amount") as
    | "discount_amount"
    | "free_item";
  const discountAmount = Number(formData.get("discountAmount") ?? 0);
  const rewardMenuId = String(formData.get("rewardMenuId") ?? "").trim();

  const res = createManualVoucher({
    customerId,
    type,
    discountAmount: type === "discount_amount" ? discountAmount : undefined,
    rewardMenuId: type === "free_item" ? rewardMenuId : undefined,
    source: "manual"
  });

  revalidatePath(`/members/${customerId}`);
  if (res.error) redirect(`/members/${customerId}?error=${encodeURIComponent(res.error)}`);
  redirect(`/members/${customerId}?ok=voucher`);
}

export async function adjustPointsAction(formData: FormData) {
  const session = getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/dashboard");

  const customerId = String(formData.get("customerId") ?? "");
  const delta = Number(formData.get("delta") ?? 0);
  const reason = String(formData.get("reason") ?? "");

  const res = adjustPoints({ customerId, delta, reason, createdBy: session.name });

  revalidatePath(`/members/${customerId}`);
  if (res.error) redirect(`/members/${customerId}?error=${encodeURIComponent(res.error)}`);
  redirect(`/members/${customerId}?ok=adjust`);
}

export async function generateBirthdayAction() {
  await withLoyaltyReady();
  const session = getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/dashboard");
  const count = generateBirthdayVouchers(session.name);
  revalidatePath("/reports/loyalty");
  redirect(`/reports/loyalty?ok=${encodeURIComponent(`${count} voucher ulang tahun diterbitkan`)}`);
}

export async function generateWinbackAction() {
  await withLoyaltyReady();
  const session = getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/dashboard");
  const count = generateWinbackVouchers(session.name);
  revalidatePath("/reports/loyalty");
  redirect(`/reports/loyalty?ok=${encodeURIComponent(`${count} voucher winback diterbitkan`)}`);
}
