"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import { getRegister, updateRegister } from "@/lib/pos-service";
import type { ReceiptPrinterMode, PosRegisterSettings } from "@/lib/pos-register-settings";

const MANAGE_ROLES = ["owner", "admin", "leader"];

function guardPosSettings(outletId?: string) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!MANAGE_ROLES.includes(session.role)) redirect("/dashboard");

  if (session.role === "leader" && outletId && session.outletId && outletId !== session.outletId) {
    redirect("/dashboard");
  }
  if (session.role === "leader" && !session.outletId && !outletId) {
    redirect("/dashboard");
  }
  return session;
}

function parseSettings(formData: FormData): Partial<PosRegisterSettings> {
  const mode = String(formData.get("receiptPrinterMode") ?? "browser");
  const receiptPrinterMode: ReceiptPrinterMode = mode === "none" ? "none" : "browser";
  const paper = Number(formData.get("paperWidthMm") ?? 80);
  const copies = Number(formData.get("receiptCopies") ?? 1);

  return {
    receiptPrinterMode,
    printerName: String(formData.get("printerName") ?? "").trim() || undefined,
    printerHost: String(formData.get("printerHost") ?? "").trim() || undefined,
    paperWidthMm: (paper === 58 ? 58 : 80) as 58 | 80,
    receiptCopies: (copies === 2 ? 2 : 1) as 1 | 2,
    autoPrintReceipt: formData.get("autoPrintReceipt") === "on",
    autoPrintKitchen: formData.get("autoPrintKitchen") === "on",
    openDrawerOnCash: formData.get("openDrawerOnCash") === "on",
    showQuickCash: formData.get("showQuickCash") === "on",
    receiptHeader: String(formData.get("receiptHeader") ?? "").trim() || undefined,
    receiptFooter: String(formData.get("receiptFooter") ?? "").trim() || undefined,
    defaultOpeningFloat: Math.max(0, Number(formData.get("defaultOpeningFloat") ?? 500000))
  };
}

export async function updateRegisterSettingsAction(formData: FormData) {
  const outletId = String(formData.get("outletId") ?? "");
  guardPosSettings(outletId || undefined);

  const registerId = String(formData.get("registerId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const returnTo = String(formData.get("returnTo") ?? "settings");

  const reg = getRegister(registerId);
  if (!reg || (outletId && reg.outletId !== outletId)) {
    redirect(`/settings/pos?outlet=${outletId}&error=${encodeURIComponent("Register tidak valid.")}`);
  }

  const result = updateRegister({
    registerId,
    name: name || undefined,
    settings: parseSettings(formData)
  });

  if (result.error) {
    redirect(`/settings/pos?outlet=${reg.outletId}&error=${encodeURIComponent(result.error)}`);
  }

  revalidatePath("/settings/pos");
  revalidatePath("/pos");
  revalidatePath("/pos/settings");

  const dest =
    returnTo === "pos"
      ? `/pos/settings?outlet=${reg.outletId}&ok=saved`
      : `/settings/pos?outlet=${reg.outletId}&ok=saved`;
  redirect(dest);
}
