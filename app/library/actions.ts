"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import {
  upsertMenuItem,
  upsertMenuCategory,
  toggleMenuItemActive,
  toggleMenuItemSoldOut,
  toggleMenuCategoryActive,
  bootstrapOutletMenu
} from "@/lib/menu-service";
import { upsertModifier, toggleModifierActive, setModifierIdsForItem } from "@/lib/modifier-service";
import { replaceVariantsForItem } from "@/lib/variant-service";
import { upsertRecipe } from "@/lib/recipe-service";
import { copyOutletMenu } from "@/lib/menu-copy";
import { bumpMenuCatalogVersion } from "@/lib/catalog-meta";
import { persistStore } from "@/lib/store";
import { isPosOutlet, POS_OUTLET_IDS } from "@/lib/pos-seed";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) {
    redirect("/dashboard");
  }
  return session;
}

function libraryRedirect(path: string, params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`${path}${q ? `?${q}` : ""}`);
}

function revalidateMenuPaths() {
  revalidatePath("/library/products");
  revalidatePath("/library/categories");
  revalidatePath("/library/modifiers");
  revalidatePath("/library/recipes");
  revalidatePath("/library/copy");
  revalidatePath("/pos");
}

function mapItemError(error: string, outletId: string) {
  const codes: Record<string, string> = {
    "duplicate-name": "duplicate",
    invalid: "invalid",
    "not-found": "not-found"
  };
  libraryRedirect("/library/products", { outlet: outletId, error: codes[error] ?? "save" });
}

export async function bootstrapOutletMenuAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) {
    libraryRedirect("/library/products", { error: "invalid-outlet" });
  }
  bootstrapOutletMenu(outletId);
  revalidateMenuPaths();
  libraryRedirect("/library/products", { outlet: outletId, ok: "bootstrapped" });
}

/** Form cepat: nama + harga + kategori (+ emoji opsional). */
export async function quickAddMenuItemAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) {
    libraryRedirect("/library/products", { error: "invalid-outlet" });
  }

  const name = String(formData.get("name") ?? "").trim();
  const basePrice = Number(formData.get("basePrice") ?? 0);
  const categoryId = String(formData.get("categoryId") ?? "") || undefined;
  const imageUrl = String(formData.get("imageUrl") ?? "") || undefined;

  if (!name || basePrice < 0 || Number.isNaN(basePrice)) {
    libraryRedirect("/library/products", { outlet: outletId, error: "invalid" });
  }

  const result = upsertMenuItem({
    outletId,
    categoryId,
    name,
    basePrice,
    imageUrl,
    active: true
  });

  if (!result.ok) {
    mapItemError(result.error, outletId);
  }

  revalidateMenuPaths();
  libraryRedirect("/library/products", { outlet: outletId, ok: "added" });
}

export async function saveMenuItemAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) {
    libraryRedirect("/library/products", { error: "invalid-outlet" });
  }

  const name = String(formData.get("name") ?? "").trim();
  const basePrice = Number(formData.get("basePrice") ?? 0);
  if (!name || basePrice < 0 || Number.isNaN(basePrice)) {
    libraryRedirect("/library/products", { outlet: outletId, error: "invalid" });
  }

  const uploaded = String(formData.get("uploadedImageUrl") ?? "").trim();
  const photoOverride = String(formData.get("photoUrl") ?? "").trim();
  const emojiIcon = String(formData.get("imageUrl") ?? "").trim();
  const modifierIds = formData.getAll("modifierId").map(String).filter(Boolean);
  const costPriceRaw = formData.get("costPrice");
  const costPrice =
    costPriceRaw != null && String(costPriceRaw).trim() !== ""
      ? Number(costPriceRaw)
      : undefined;

  const result = upsertMenuItem({
    id: String(formData.get("id") ?? "") || undefined,
    outletId,
    categoryId: String(formData.get("categoryId") ?? "") || undefined,
    sku: String(formData.get("sku") ?? "") || undefined,
    name,
    description: String(formData.get("description") ?? "") || undefined,
    imageUrl: uploaded || photoOverride || emojiIcon || undefined,
    basePrice,
    costPrice: costPrice != null && !Number.isNaN(costPrice) ? costPrice : undefined,
    soldOut: formData.get("soldOut") === "1",
    defaultAreaId: String(formData.get("defaultAreaId") ?? "") || undefined,
    prepTimeMinutes: Number(formData.get("prepTimeMinutes") ?? 0) || undefined,
    active: formData.get("active") !== "0"
  });

  if (!result.ok) {
    mapItemError(result.error, outletId);
  } else {
    setModifierIdsForItem(result.item.id, modifierIds);
    const variantNames = formData.getAll("variantName").map(String);
    const variantPrices = formData.getAll("variantPrice").map((v) => Number(v));
    const variantCosts = formData.getAll("variantCostPrice").map((v) => Number(v));
    const variantSkus = formData.getAll("variantSku").map(String);
    const variants = variantNames
      .map((vn, i) => ({
        name: vn.trim(),
        price: variantPrices[i] ?? 0,
        costPrice: variantCosts[i],
        sku: variantSkus[i]?.trim()
      }))
      .filter((v) => v.name);
    replaceVariantsForItem(result.item.id, outletId, variants);
  }

  revalidateMenuPaths();
  libraryRedirect("/library/products", { outlet: outletId, ok: "saved" });
}

export async function saveModifierAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) {
    libraryRedirect("/library/modifiers", { error: "invalid-outlet" });
  }
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    libraryRedirect("/library/modifiers", { outlet: outletId, error: "invalid" });
  }
  upsertModifier({
    id: String(formData.get("id") ?? "") || undefined,
    outletId,
    name,
    priceDelta: Number(formData.get("priceDelta") ?? 0),
    active: formData.get("active") !== "0"
  });
  revalidateMenuPaths();
  libraryRedirect("/library/modifiers", { outlet: outletId, ok: "saved" });
}

export async function toggleModifierAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  toggleModifierActive(id, formData.get("active") === "1");
  revalidateMenuPaths();
  libraryRedirect("/library/modifiers", { outlet: outletId, ok: "toggled" });
}

export async function toggleMenuItemAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  toggleMenuItemActive(id, active);
  revalidateMenuPaths();
  libraryRedirect("/library/products", { outlet: outletId, ok: active ? "activated" : "deactivated" });
}

export async function saveMenuCategoryAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) {
    libraryRedirect("/library/categories", { error: "invalid-outlet" });
  }

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    libraryRedirect("/library/categories", { outlet: outletId, error: "invalid" });
  }

  const result = upsertMenuCategory({
    id: String(formData.get("id") ?? "") || undefined,
    outletId,
    name,
    sortOrder: Number(formData.get("sortOrder") ?? 0) || undefined,
    active: formData.get("active") !== "0"
  });

  if (!result.ok) {
    const codes: Record<string, string> = {
      "duplicate-name": "duplicate",
      invalid: "invalid",
      "not-found": "not-found"
    };
    libraryRedirect("/library/categories", {
      outlet: outletId,
      error: codes[result.error] ?? "save"
    });
  }

  revalidateMenuPaths();
  libraryRedirect("/library/categories", { outlet: outletId, ok: "saved" });
}

export async function toggleMenuCategoryAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  toggleMenuCategoryActive(id, active);
  revalidateMenuPaths();
  libraryRedirect("/library/categories", { outlet: outletId, ok: active ? "activated" : "deactivated" });
}

export async function toggleSoldOutAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const soldOut = formData.get("soldOut") === "1";
  toggleMenuItemSoldOut(id, soldOut);
  revalidateMenuPaths();
  libraryRedirect("/library/products", { outlet: outletId, ok: soldOut ? "soldout" : "instock" });
}

export async function saveRecipeAction(formData: FormData) {
  const session = requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const menuItemId = String(formData.get("menuItemId") ?? "");
  if (!isPosOutlet(outletId) || !menuItemId) {
    libraryRedirect("/library/recipes", { error: "invalid" });
  }
  const itemIds = formData.getAll("ingredientId").map(String).filter(Boolean);
  const qtys = formData.getAll("ingredientQty").map((v) => Number(v));
  const units = formData.getAll("ingredientUnit").map(String);
  const lines = itemIds
    .map((itemId, i) => ({
      itemId,
      qty: qtys[i] ?? 0,
      unit: units[i] ?? "pcs"
    }))
    .filter((l) => l.itemId && l.qty > 0);
  upsertRecipe({
    menuItemId,
    name: String(formData.get("recipeName") ?? "").trim() || "Resep",
    lines,
    actorId: session.sub,
    actorName: session.name
  });
  revalidateMenuPaths();
  libraryRedirect("/library/recipes", { outlet: outletId, item: menuItemId, ok: "saved" });
}

export async function copyMenuAction(formData: FormData) {
  const session = requireLibraryRole();
  if (session.role !== "owner" && session.role !== "admin") {
    libraryRedirect("/library/copy", { error: "forbidden" });
  }
  const sourceOutletId = String(formData.get("sourceOutletId") ?? "");
  const targetOutletId = String(formData.get("targetOutletId") ?? "");
  if (
    !POS_OUTLET_IDS.has(sourceOutletId) ||
    !POS_OUTLET_IDS.has(targetOutletId) ||
    sourceOutletId === targetOutletId
  ) {
    libraryRedirect("/library/copy", { error: "invalid" });
  }
  copyOutletMenu(sourceOutletId, targetOutletId);
  revalidateMenuPaths();
  libraryRedirect("/library/copy", {
    source: sourceOutletId,
    target: targetOutletId,
    ok: "copied"
  });
}

export async function syncPosMenuAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) {
    libraryRedirect("/library/products", { error: "invalid-outlet" });
  }
  bumpMenuCatalogVersion(outletId);
  persistStore();
  revalidateMenuPaths();
  libraryRedirect("/library/products", { outlet: outletId, ok: "synced" });
}
