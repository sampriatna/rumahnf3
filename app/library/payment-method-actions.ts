"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertPosPaymentMethod,
  togglePosPaymentMethodActive,
  resetPaymentMethodsFromSeed,
  type PaymentMethodKind,
  type PaymentShiftBucket
} from "@/lib/payment-method-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectMethods(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/payment-methods${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/payment-methods");
  revalidatePath("/library/chart-of-accounts");
  revalidatePath("/pos");
  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
}

export async function savePaymentMethodAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectMethods({ error: "invalid-outlet" });

  const res = upsertPosPaymentMethod({
    outletId,
    id: String(formData.get("id") ?? "") || undefined,
    name: String(formData.get("name") ?? ""),
    kind: String(formData.get("kind") ?? "other") as PaymentMethodKind,
    coaAccountId: String(formData.get("coaAccountId") ?? ""),
    shiftBucket: String(formData.get("shiftBucket") ?? "cash") as PaymentShiftBucket,
    heldCashEnabled: formData.get("heldCashEnabled") === "1",
    heldCashSource: String(formData.get("heldCashSource") ?? "").trim() || undefined,
    heldCashReleaseDays: Number(formData.get("heldCashReleaseDays") ?? 0) || undefined,
    sortOrder: Number(formData.get("sortOrder") ?? 1)
  });

  if (!res.ok) {
    redirectMethods({
      outlet: outletId,
      error: res.error === "duplicate" ? "duplicate" : res.error === "coa" ? "coa" : "invalid"
    });
  }

  revalidatePaths();
  redirectMethods({ outlet: outletId, ok: "saved" });
}

export async function togglePaymentMethodAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  const res = togglePosPaymentMethodActive(outletId, id, active);
  if (!res.ok) redirectMethods({ outlet: outletId, error: "not-found" });
  revalidatePaths();
  redirectMethods({ outlet: outletId, ok: active ? "on" : "off" });
}

export async function bootstrapPaymentMethodsAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectMethods({ error: "invalid-outlet" });
  resetPaymentMethodsFromSeed(outletId);
  revalidatePaths();
  redirectMethods({ outlet: outletId, ok: "bootstrapped" });
}
