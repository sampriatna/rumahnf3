"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertBranchSetting,
  toggleBranchItemActive,
  resetBranchMenuFromSeed,
  enableAllCatalogAtBranch,
  getDefaultCatalogOutlet
} from "@/lib/branch-menu-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectBranch(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/branch-menu${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/branch-menu");
  revalidatePath("/library/products");
  revalidatePath("/pos");
  revalidatePath("/kds");
}

export async function saveBranchMenuInline(input: {
  branchOutletId: string;
  catalogOutletId: string;
  menuItemId: string;
  price?: number | null;
  active: boolean;
  soldOut: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  requireLibraryRole();
  const { branchOutletId, catalogOutletId, menuItemId, price, active, soldOut } = input;

  if (!isPosOutlet(branchOutletId) || !menuItemId) {
    return { ok: false, error: "invalid" };
  }

  const res = upsertBranchSetting({
    menuItemId,
    outletId: branchOutletId,
    price: price ?? null,
    active,
    soldOut
  });

  if (!res.ok) return { ok: false, error: res.error };

  revalidatePaths();
  return { ok: true };
}

export async function toggleBranchMenuInline(input: {
  branchOutletId: string;
  menuItemId: string;
  active: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  requireLibraryRole();
  const { branchOutletId, menuItemId, active } = input;

  const res = toggleBranchItemActive(branchOutletId, menuItemId, active);
  if (!res.ok) return { ok: false, error: "not-found" };

  revalidatePaths();
  return { ok: true };
}

export async function saveBranchMenuAction(formData: FormData) {
  requireLibraryRole();
  const branchOutletId = String(formData.get("branchOutletId") ?? "");
  const catalogOutletId = String(formData.get("catalogOutletId") ?? getDefaultCatalogOutlet());
  const menuItemId = String(formData.get("menuItemId") ?? "");
  if (!isPosOutlet(branchOutletId) || !menuItemId) {
    redirectBranch({ error: "invalid" });
  }

  const priceRaw = String(formData.get("price") ?? "").trim();
  const price = priceRaw === "" ? null : Number(priceRaw);
  const active = formData.get("active") === "1";
  const soldOut = formData.get("soldOut") === "1";

  const res = upsertBranchSetting({
    menuItemId,
    outletId: branchOutletId,
    price,
    active,
    soldOut
  });

  if (!res.ok) redirectBranch({ branch: branchOutletId, catalog: catalogOutletId, error: res.error });

  revalidatePaths();
  redirectBranch({ branch: branchOutletId, catalog: catalogOutletId, ok: "saved" });
}

export async function toggleBranchMenuAction(formData: FormData) {
  requireLibraryRole();
  const branchOutletId = String(formData.get("branchOutletId") ?? "");
  const catalogOutletId = String(formData.get("catalogOutletId") ?? getDefaultCatalogOutlet());
  const menuItemId = String(formData.get("menuItemId") ?? "");
  const active = formData.get("active") === "1";

  const res = toggleBranchItemActive(branchOutletId, menuItemId, active);
  if (!res.ok) redirectBranch({ branch: branchOutletId, catalog: catalogOutletId, error: "not-found" });

  revalidatePaths();
  redirectBranch({ branch: branchOutletId, catalog: catalogOutletId, ok: active ? "on" : "off" });
}

export async function enableAllCatalogAction(formData: FormData) {
  requireLibraryRole();
  const branchOutletId = String(formData.get("branchOutletId") ?? "");
  const catalogOutletId = String(formData.get("catalogOutletId") ?? getDefaultCatalogOutlet());
  if (!isPosOutlet(branchOutletId) || branchOutletId === catalogOutletId) {
    redirectBranch({ error: "invalid" });
  }

  const res = enableAllCatalogAtBranch(catalogOutletId, branchOutletId);
  if (!res.ok) redirectBranch({ branch: branchOutletId, catalog: catalogOutletId, error: "invalid" });

  revalidatePaths();
  redirectBranch({ branch: branchOutletId, catalog: catalogOutletId, ok: "enabled-all" });
}

export async function bootstrapBranchMenuAction(formData: FormData) {
  requireLibraryRole();
  const branchOutletId = String(formData.get("branchOutletId") ?? "");
  const catalogOutletId = String(formData.get("catalogOutletId") ?? getDefaultCatalogOutlet());
  if (!isPosOutlet(branchOutletId)) redirectBranch({ error: "invalid" });

  resetBranchMenuFromSeed(branchOutletId);
  revalidatePaths();
  redirectBranch({ branch: branchOutletId, catalog: catalogOutletId, ok: "bootstrapped" });
}
