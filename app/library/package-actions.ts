"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertMenuPackage,
  toggleMenuPackageActive,
  resetPackagesFromSeed
} from "@/lib/package-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectPackages(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/packages${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/packages");
  revalidatePath("/pos");
}

export async function saveMenuPackageAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectPackages({ error: "invalid-outlet" });

  const menuItemIds = formData.getAll("menuItemId").map(String).filter(Boolean);
  const qtys = formData.getAll("itemQty").map((v) => Number(v) || 1);
  const items = menuItemIds.map((menuItemId, i) => ({
    menuItemId,
    qty: qtys[i] ?? 1,
    sortOrder: i + 1
  }));

  const res = upsertMenuPackage({
    id: String(formData.get("id") ?? "") || undefined,
    outletId,
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? "") || undefined,
    bundlePrice: Number(formData.get("bundlePrice") ?? 0),
    sortOrder: Number(formData.get("sortOrder") ?? 1),
    items
  });

  if (!res.ok) {
    const err =
      res.error === "duplicate"
        ? "duplicate"
        : res.error === "empty-items"
          ? "empty-items"
          : "invalid";
    redirectPackages({ outlet: outletId, error: err });
  }

  revalidatePaths();
  redirectPackages({ outlet: outletId, ok: "package-saved" });
}

export async function toggleMenuPackageAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  const res = toggleMenuPackageActive(id, active);
  if (!res.ok) redirectPackages({ outlet: outletId, error: "not-found" });
  revalidatePaths();
  redirectPackages({ outlet: outletId, ok: active ? "package-on" : "package-off" });
}

export async function bootstrapPackagesAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectPackages({ error: "invalid-outlet" });
  resetPackagesFromSeed(outletId);
  revalidatePaths();
  redirectPackages({ outlet: outletId, ok: "bootstrapped" });
}
