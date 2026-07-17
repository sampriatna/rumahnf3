"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertPosMenuLayout,
  resetPosMenuLayoutsFromSeed,
  type PosMenuLayoutColumns,
  type PosMenuLayoutViewMode
} from "@/lib/pos-menu-layout-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectLayouts(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/pos-menu-layout${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/pos-menu-layout");
  revalidatePath("/pos");
}

export async function savePosMenuLayoutAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectLayouts({ error: "invalid-outlet" });

  const categoryOrder = String(formData.get("categoryOrder") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const hiddenCategoryIds = formData
    .getAll("hiddenCategoryIds")
    .map((v) => String(v).trim())
    .filter(Boolean);
  const pinnedItemIds = formData
    .getAll("pinnedItemIds")
    .map((v) => String(v).trim())
    .filter(Boolean);

  const columns = Number(formData.get("columns") ?? 3) as PosMenuLayoutColumns;
  const viewMode = String(formData.get("viewMode") ?? "tabs") as PosMenuLayoutViewMode;

  const res = upsertPosMenuLayout({
    id: String(formData.get("id") ?? "") || undefined,
    outletId,
    name: String(formData.get("name") ?? "Default"),
    columns,
    viewMode,
    showPackages: formData.get("showPackages") === "1",
    categoryOrder,
    hiddenCategoryIds,
    pinnedItemIds,
    active: true
  });

  if (!res.ok) {
    redirectLayouts({
      outlet: outletId,
      error: res.error === "duplicate" ? "duplicate" : "invalid"
    });
  }

  revalidatePaths();
  redirectLayouts({ outlet: outletId, ok: "saved" });
}

export async function moveCategoryOrderAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const layoutId = String(formData.get("layoutId") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const direction = String(formData.get("direction") ?? "");

  const { getPosMenuLayout } = await import("@/lib/pos-menu-layout-service");
  const layout = getPosMenuLayout(outletId, layoutId);
  if (!layout) {
    redirectLayouts({ outlet: outletId, error: "not-found" });
    return;
  }

  const order = [...layout.categoryOrder];
  const idx = order.indexOf(categoryId);
  if (idx === -1) {
    order.push(categoryId);
  } else if (direction === "up" && idx > 0) {
    [order[idx - 1], order[idx]] = [order[idx], order[idx - 1]];
  } else if (direction === "down" && idx < order.length - 1) {
    [order[idx + 1], order[idx]] = [order[idx], order[idx + 1]];
  }

  upsertPosMenuLayout({
    id: layout.id,
    outletId,
    name: layout.name,
    categoryOrder: order
  });

  revalidatePaths();
  redirectLayouts({ outlet: outletId, ok: "saved" });
}

export async function bootstrapPosMenuLayoutsAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectLayouts({ error: "invalid-outlet" });
  resetPosMenuLayoutsFromSeed(outletId);
  revalidatePaths();
  redirectLayouts({ outlet: outletId, ok: "bootstrapped" });
}
