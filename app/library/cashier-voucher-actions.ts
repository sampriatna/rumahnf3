"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertCashierVoucher,
  toggleCashierVoucherActive,
  resetCashierVouchersFromSeed,
  type CashierVoucherType
} from "@/lib/cashier-voucher-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectVouchers(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/cashier-vouchers${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/cashier-vouchers");
  revalidatePath("/pos");
}

export async function saveCashierVoucherAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectVouchers({ error: "invalid-outlet" });

  const voucherType = String(formData.get("voucherType") ?? "fixed") as CashierVoucherType;
  const res = upsertCashierVoucher({
    id: String(formData.get("id") ?? "") || undefined,
    outletId,
    name: String(formData.get("name") ?? ""),
    code: String(formData.get("code") ?? ""),
    voucherType,
    value: Number(formData.get("value") ?? 0),
    minSubtotal: Number(formData.get("minSubtotal") ?? 0) || undefined,
    maxDiscount: Number(formData.get("maxDiscount") ?? 0) || undefined,
    usageLimit: Number(formData.get("usageLimit") ?? 0) || undefined,
    validFrom: String(formData.get("validFrom") ?? "") || undefined,
    validTo: String(formData.get("validTo") ?? "") || undefined,
    sortOrder: Number(formData.get("sortOrder") ?? 1)
  });

  if (!res.ok) {
    redirectVouchers({
      outlet: outletId,
      error:
        res.error === "duplicate-code"
          ? "duplicate-code"
          : res.error === "duplicate"
            ? "duplicate"
            : "invalid"
    });
  }

  revalidatePaths();
  redirectVouchers({ outlet: outletId, ok: "saved" });
}

export async function toggleCashierVoucherAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  const res = toggleCashierVoucherActive(id, active);
  if (!res.ok) redirectVouchers({ outlet: outletId, error: "not-found" });
  revalidatePaths();
  redirectVouchers({ outlet: outletId, ok: active ? "on" : "off" });
}

export async function bootstrapCashierVouchersAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectVouchers({ error: "invalid-outlet" });
  resetCashierVouchersFromSeed(outletId);
  revalidatePaths();
  redirectVouchers({ outlet: outletId, ok: "bootstrapped" });
}
