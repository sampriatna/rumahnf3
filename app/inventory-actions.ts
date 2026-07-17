"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { requireAuthz } from "@/lib/auth-guard";
import {
  markPoPurchased,
  receivePurchaseOrder,
  stockInManual,
  getItem
} from "@/lib/inventory-service";
import { recordPurchasePayment } from "@/lib/finance-service";
import { WAREHOUSE_ID, WAREHOUSE_LABEL } from "@/lib/inventory";
import { financeAccessForSession } from "@/lib/finance-access";
import { PHASE0_FLAGS } from "@/lib/phase0-flags";

const HANDLER = ["leader", "owner", "admin"];

export async function markPurchasedAction(formData: FormData) {
  const session = PHASE0_FLAGS.authorizationPipeline
    ? requireAuthz({ roles: ["leader", "owner", "admin"], redirectTo: "/purchasing" })
    : getSession();
  if (!session || !HANDLER.includes(session.role)) redirect("/purchasing");

  const id = String(formData.get("id") ?? "");
  markPoPurchased(id);
  revalidatePath("/purchasing");
}

export async function receivePoAction(formData: FormData) {
  const session = PHASE0_FLAGS.authorizationPipeline
    ? requireAuthz({ roles: ["leader", "owner", "admin"], redirectTo: "/purchasing" })
    : getSession();
  if (!session || !HANDLER.includes(session.role)) redirect("/purchasing");
  const financeAccess = financeAccessForSession(session);

  const id = String(formData.get("id") ?? "");
  const actual = Number(formData.get("actual") ?? 0);
  const areaUnitFromForm = String(formData.get("areaUnit") ?? "").trim() || undefined;
  const received = receivePurchaseOrder(id, actual, session.name);
  if (received && actual > 0) {
    const areaUnit = areaUnitFromForm ?? received.areaUnit;
    const paymentAccount = areaUnit === "Jagasatru" ? "jagasatru_wallet" : "purchasing_kecil_wallet";
    recordPurchasePayment({
      supplierName: received.supplierName,
      amount: actual,
      poId: id,
      payNow: false,
      createdBy: session.name,
      accountId: financeAccess.inputAccounts.includes(paymentAccount) ? paymentAccount : "bank",
      areaUnit
    });
  }
  revalidatePath("/purchasing");
  revalidatePath("/inventory");
  revalidatePath("/finance");
  revalidatePath("/finance/ledger");
}

export async function stockInAction(formData: FormData) {
  const session = PHASE0_FLAGS.authorizationPipeline
    ? requireAuthz({ roles: ["leader", "owner", "admin"], redirectTo: "/inventory" })
    : getSession();
  if (!session || !HANDLER.includes(session.role)) redirect("/inventory");

  const itemId = String(formData.get("itemId") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  const locationId = String(formData.get("locationId") ?? WAREHOUSE_ID);
  const locationLabel = String(formData.get("locationLabel") ?? WAREHOUSE_LABEL);
  const note = String(formData.get("note") ?? "").trim();

  if (qty > 0 && getItem(itemId)) {
    stockInManual({
      itemId,
      qty,
      locationId,
      locationLabel,
      note: note || undefined,
      createdBy: session.name
    });
  }
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
}
