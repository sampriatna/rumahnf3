"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { hashPin } from "@/lib/pin-crypto";
import { upsertCashierPin, setCashierPinActive } from "@/lib/db/auth-repo";
import { isRole, type Role } from "@/lib/types";
import { nextId } from "@/lib/store";

const MANAGE_ROLES = ["owner", "admin"];

function guardSettings() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!MANAGE_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

export async function addCashierPinAction(formData: FormData) {
  const session = guardSettings();
  const outletId = String(formData.get("outletId") ?? "");
  const pin = String(formData.get("pin") ?? "").trim();
  const labelRaw = String(formData.get("label") ?? "").trim();
  const roleRaw = String(formData.get("role") ?? "staff");
  const role: Role = isRole(roleRaw) ? roleRaw : "staff";

  if (!outletId || pin.length < 4 || pin.length > 8) {
    redirect("/settings/pins?error=invalid");
  }

  const outlet = OUTLETS.find((o) => o.id === outletId);
  const label = labelRaw || `Kasir ${outlet?.name ?? outletId}`;
  const now = new Date().toISOString();
  const ok = await upsertCashierPin({
    id: nextId("PIN"),
    outletId,
    outletName: outlet?.name,
    label,
    pinHash: await hashPin(pin),
    role,
    active: true,
    createdById: session.sub,
    createdByName: session.name,
    createdAt: now,
    updatedAt: now
  });

  if (!ok) redirect("/settings/pins?error=save");
  revalidatePath("/settings/pins");
  redirect("/settings/pins?ok=1");
}

export async function toggleCashierPinAction(formData: FormData) {
  guardSettings();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "1";
  if (!id) redirect("/settings/pins");
  await setCashierPinActive(id, active);
  revalidatePath("/settings/pins");
  redirect("/settings/pins");
}
