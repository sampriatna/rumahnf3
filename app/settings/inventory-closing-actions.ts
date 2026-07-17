"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { updateClosingOpnameRule } from "@/lib/inventory-sheet-store";

const ROLES = ["owner", "admin"];

export async function toggleClosingOpnameWajibAction(formData: FormData) {
  const session = getSession();
  if (!session || !ROLES.includes(session.role)) redirect("/dashboard");

  const id = String(formData.get("id") ?? "");
  const wajib = formData.get("wajib") === "1";
  if (!id) redirect("/settings/inventory-closing?error=1");

  updateClosingOpnameRule(id, { wajibOpname: wajib });

  revalidatePath("/settings/inventory-closing");
  revalidatePath("/kds");
  redirect("/settings/inventory-closing?saved=1");
}
