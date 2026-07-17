"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { hashPin } from "@/lib/pin-crypto";
import { upsertAuthAccount, setAuthAccountActive, getAccountByPhone, getAccountById } from "@/lib/db/auth-repo";
import type { Role, StaffCapability } from "@/lib/types";
import { nextId } from "@/lib/store";
import { isSupabaseConfigured } from "@/lib/supabase";

const MANAGE_ROLES = ["owner", "admin"];

function guardSettings() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!MANAGE_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function parseAccountType(formData: FormData): { role: Role; capabilities?: StaffCapability[] } {
  const t = String(formData.get("accountType") ?? "personal");
  if (t === "leader") return { role: "leader" };
  if (t === "kds") return { role: "staff", capabilities: ["kds"] };
  if (t === "purchasing") return { role: "staff", capabilities: ["inventory", "forms"] };
  return { role: "staff", capabilities: ["forms"] };
}

export async function addStaffAccountAction(formData: FormData) {
  const session = guardSettings();
  if (!isSupabaseConfigured()) redirect("/settings/accounts?error=no-db");

  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const pin = String(formData.get("pin") ?? "").trim();
  const outletId = String(formData.get("outletId") ?? "").trim() || undefined;
  const { role, capabilities } = parseAccountType(formData);

  if (!fullName || !phone || pin.length < 4 || pin.length > 8) {
    redirect("/settings/accounts?error=invalid");
  }
  if (!outletId) {
    redirect("/settings/accounts?error=invalid");
  }

  const existing = await getAccountByPhone(phone);
  if (existing) redirect("/settings/accounts?error=phone");

  const outlet = outletId ? OUTLETS.find((o) => o.id === outletId) : undefined;
  const now = new Date().toISOString();

  const ok = await upsertAuthAccount({
    id: nextId("USR"),
    phone,
    fullName,
    role,
    outletId: outlet?.id,
    isSuperAdmin: false,
    pinHash: await hashPin(pin),
    active: true,
    capabilities: role === "leader" ? undefined : capabilities,
    createdAt: now,
    updatedAt: now
  });

  if (!ok) redirect("/settings/accounts?error=save");
  revalidatePath("/settings/accounts");
  redirect("/settings/accounts?ok=1");
}

export async function toggleStaffAccountAction(formData: FormData) {
  guardSettings();
  if (!isSupabaseConfigured()) redirect("/settings/accounts?error=no-db");

  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  if (!id) redirect("/settings/accounts");

  await setAuthAccountActive(id, active);
  revalidatePath("/settings/accounts");
  redirect("/settings/accounts");
}

export async function resetStaffPinAction(formData: FormData) {
  guardSettings();
  if (!isSupabaseConfigured()) redirect("/settings/accounts?error=no-db");

  const id = String(formData.get("id") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();

  if (!id || pin.length < 4 || pin.length > 8) redirect("/settings/accounts?error=invalid");

  const existing = await getAccountById(id);
  if (!existing) redirect("/settings/accounts?error=save");

  const ok = await upsertAuthAccount({
    ...existing,
    pinHash: await hashPin(pin),
    updatedAt: new Date().toISOString()
  });

  if (!ok) redirect("/settings/accounts?error=save");
  revalidatePath("/settings/accounts");
  redirect("/settings/accounts?ok=pin");
}
