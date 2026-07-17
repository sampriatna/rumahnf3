"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertSalesChannel,
  toggleSalesChannelActive,
  setDefaultSalesChannel,
  resetChannelsFromSeed,
  type SalesChannelKind
} from "@/lib/channel-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectChannels(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/channels${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/channels");
  revalidatePath("/pos");
  revalidatePath("/kds");
  revalidatePath("/pos/reports");
}

export async function saveChannelAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectChannels({ error: "invalid-outlet" });

  const kind = String(formData.get("kind") ?? "other") as SalesChannelKind;
  const res = upsertSalesChannel({
    id: String(formData.get("id") ?? "") || undefined,
    slug: String(formData.get("slug") ?? "") || undefined,
    outletId,
    name: String(formData.get("name") ?? ""),
    kind,
    requiresTable: formData.get("requiresTable") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 1),
    isDefault: formData.get("isDefault") === "on"
  });

  if (!res.ok) {
    redirectChannels({
      outlet: outletId,
      error: res.error === "duplicate" ? "duplicate" : res.error === "not-found" ? "not-found" : "invalid"
    });
  }

  revalidatePaths();
  redirectChannels({ outlet: outletId, ok: "channel-saved" });
}

export async function toggleChannelAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  const res = toggleSalesChannelActive(outletId, id, active);
  if (!res.ok) redirectChannels({ outlet: outletId, error: "not-found" });
  revalidatePaths();
  redirectChannels({ outlet: outletId, ok: active ? "channel-on" : "channel-off" });
}

export async function setDefaultChannelAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const res = setDefaultSalesChannel(outletId, id);
  if (!res.ok) redirectChannels({ outlet: outletId, error: "not-found" });
  revalidatePaths();
  redirectChannels({ outlet: outletId, ok: "default-set" });
}

export async function bootstrapChannelsAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectChannels({ error: "invalid-outlet" });
  resetChannelsFromSeed(outletId);
  revalidatePaths();
  redirectChannels({ outlet: outletId, ok: "bootstrapped" });
}
