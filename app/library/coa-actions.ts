"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  upsertChartOfAccount,
  toggleChartOfAccountActive,
  resetCoaFromSeed,
  type CoaAccountType
} from "@/lib/coa-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectCoa(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/chart-of-accounts${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/chart-of-accounts");
  revalidatePath("/library/payment-methods");
  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
  revalidatePath("/pos");
}

export async function saveCoaAction(formData: FormData) {
  requireLibraryRole();
  const res = upsertChartOfAccount({
    id: String(formData.get("id") ?? "") || undefined,
    code: String(formData.get("code") ?? ""),
    name: String(formData.get("name") ?? ""),
    accountType: String(formData.get("accountType") ?? "asset") as CoaAccountType,
    trackBalance: formData.get("trackBalance") === "1",
    ready: formData.get("ready") === "1",
    sortOrder: Number(formData.get("sortOrder") ?? 1)
  });

  if (!res.ok) {
    redirectCoa({ error: res.error === "duplicate" ? "duplicate" : "invalid" });
  }

  revalidatePaths();
  redirectCoa({ ok: "saved" });
}

export async function toggleCoaAction(formData: FormData) {
  requireLibraryRole();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  const res = toggleChartOfAccountActive(id, active);
  if (!res.ok) redirectCoa({ error: "not-found" });
  revalidatePaths();
  redirectCoa({ ok: active ? "on" : "off" });
}

export async function bootstrapCoaAction() {
  requireLibraryRole();
  resetCoaFromSeed();
  revalidatePaths();
  redirectCoa({ ok: "bootstrapped" });
}
