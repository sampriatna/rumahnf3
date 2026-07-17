"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertCancelReason,
  toggleCancelReasonActive,
  resetCancelReasonsFromSeed,
  type CancelReasonScope
} from "@/lib/cancel-reason-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectCancel(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/cancel-reasons${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/cancel-reasons");
  revalidatePath("/pos");
}

export async function saveCancelReasonAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectCancel({ error: "invalid-outlet" });

  const scope = String(formData.get("scope") ?? "all") as CancelReasonScope;
  const res = upsertCancelReason({
    id: String(formData.get("id") ?? "") || undefined,
    outletId,
    name: String(formData.get("name") ?? ""),
    scope,
    requiresNote: formData.get("requiresNote") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 1),
    active: formData.get("active") !== "0"
  });

  if (!res.ok) {
    redirectCancel({
      outlet: outletId,
      error: res.error === "duplicate" ? "duplicate" : res.error === "not-found" ? "not-found" : "invalid"
    });
  }

  revalidatePaths();
  redirectCancel({ outlet: outletId, ok: "saved" });
}

export async function toggleCancelReasonAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  const res = toggleCancelReasonActive(outletId, id, active);
  if (!res.ok) redirectCancel({ outlet: outletId, error: "not-found" });
  revalidatePaths();
  redirectCancel({ outlet: outletId, ok: active ? "on" : "off" });
}

export async function bootstrapCancelReasonsAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectCancel({ error: "invalid-outlet" });
  resetCancelReasonsFromSeed(outletId);
  revalidatePaths();
  redirectCancel({ outlet: outletId, ok: "bootstrapped" });
}
