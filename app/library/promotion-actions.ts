"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertPromotion,
  togglePromotionActive,
  resetPromotionsFromSeed,
  type PromoType
} from "@/lib/promotion-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectPromos(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/promotions${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/promotions");
  revalidatePath("/pos");
}

export async function savePromotionAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectPromos({ error: "invalid-outlet" });

  const promoType = String(formData.get("promoType") ?? "order_percent") as PromoType;
  const targetRaw = String(formData.get("targetMenuItemIds") ?? "");
  const targetMenuItemIds = targetRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const res = upsertPromotion({
    id: String(formData.get("id") ?? "") || undefined,
    outletId,
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? "") || undefined,
    promoType,
    value: Number(formData.get("value") ?? 0),
    targetMenuItemIds,
    minSubtotal: Number(formData.get("minSubtotal") ?? 0) || undefined,
    validFrom: String(formData.get("validFrom") ?? "") || undefined,
    validTo: String(formData.get("validTo") ?? "") || undefined,
    sortOrder: Number(formData.get("sortOrder") ?? 1)
  });

  if (!res.ok) redirectPromos({ outlet: outletId, error: res.error === "duplicate" ? "duplicate" : "invalid" });

  revalidatePaths();
  redirectPromos({ outlet: outletId, ok: "promo-saved" });
}

export async function togglePromotionAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  const res = togglePromotionActive(id, active);
  if (!res.ok) redirectPromos({ outlet: outletId, error: "not-found" });
  revalidatePaths();
  redirectPromos({ outlet: outletId, ok: active ? "promo-on" : "promo-off" });
}

export async function bootstrapPromotionsAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectPromos({ error: "invalid-outlet" });
  resetPromotionsFromSeed(outletId);
  revalidatePaths();
  redirectPromos({ outlet: outletId, ok: "bootstrapped" });
}
