"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getItem } from "@/lib/inventory-service";
import { isGlobalRole } from "@/lib/data-scope";
import {
  createTransferRequest,
  sendTransferRequest,
  receiveTransferRequest,
  cancelTransferRequest,
  getTransferRequest
} from "@/lib/transfer-service";

const VIEW_ROLES = ["leader", "owner", "admin"];

function transfersUrl(msg?: string) {
  return msg ? `/inventory/transfers?error=${encodeURIComponent(msg)}` : "/inventory/transfers?ok=1";
}

function detailUrl(id: string, msg?: string) {
  return msg
    ? `/inventory/transfers/${id}?error=${encodeURIComponent(msg)}`
    : `/inventory/transfers/${id}?ok=1`;
}

function resolveOutlet(session: NonNullable<ReturnType<typeof getSession>>, param: string) {
  if (isGlobalRole(session.role, session.isSuperAdmin)) return param;
  return session.outletId ?? param;
}

export async function createTransferAction(formData: FormData) {
  const session = getSession();
  if (!session || !VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const toOutletId = resolveOutlet(session, String(formData.get("toOutletId") ?? ""));
  const itemId = String(formData.get("itemId") ?? "");
  const qty = Number(formData.get("qty") ?? 0);
  const note = String(formData.get("note") ?? "").trim();
  const item = getItem(itemId);

  if (!toOutletId || !item || qty <= 0) {
    redirect(transfersUrl("Lengkapi outlet, barang, dan jumlah."));
  }

  createTransferRequest({
    toOutletId,
    items: [{ itemId: item.id, itemName: item.itemName, qty, unit: item.unit }],
    requestedById: session.sub,
    requestedByName: session.name,
    note: note || undefined
  });

  revalidatePath("/inventory/transfers");
  revalidatePath("/inventory");
  redirect(transfersUrl());
}

export async function sendTransferAction(formData: FormData) {
  const session = getSession();
  if (!session || !isGlobalRole(session.role, session.isSuperAdmin)) redirect("/dashboard");

  const id = String(formData.get("id") ?? "");
  const res = await sendTransferRequest(id, { id: session.sub, name: session.name });
  revalidatePath("/inventory/transfers");
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath(`/inventory/transfers/${id}`);
  redirect(detailUrl(id, res.error));
}

export async function receiveTransferAction(formData: FormData) {
  const session = getSession();
  if (!session || !VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const id = String(formData.get("id") ?? "");
  const tr = getTransferRequest(id);
  if (
    tr &&
    !isGlobalRole(session.role, session.isSuperAdmin) &&
    session.outletId &&
    tr.toOutletId !== session.outletId
  ) {
    redirect("/inventory/transfers?error=Outlet tidak sesuai.");
  }

  const res = await receiveTransferRequest(id, { id: session.sub, name: session.name });
  if (res.error) {
    redirect(detailUrl(id, res.error));
  }
  revalidatePath("/inventory/transfers");
  revalidatePath("/inventory");
  revalidatePath("/inventory/movements");
  revalidatePath(`/inventory/transfers/${id}`);
  redirect(detailUrl(id));
}

export async function cancelTransferAction(formData: FormData) {
  const session = getSession();
  if (!session || !VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const id = String(formData.get("id") ?? "");
  const res = cancelTransferRequest(id);
  revalidatePath("/inventory/transfers");
  revalidatePath(`/inventory/transfers/${id}`);
  redirect(detailUrl(id, res.error));
}
