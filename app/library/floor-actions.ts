"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertTableSection,
  upsertFloorTable,
  toggleTableSectionActive,
  toggleFloorTableActive,
  bootstrapFloorFromSeed,
  resetFloorFromSeed
} from "@/lib/floor-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function floorRedirect(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/floor${q ? `?${q}` : ""}`);
}

function revalidateFloorPaths() {
  revalidatePath("/library/floor");
  revalidatePath("/pos/floor");
  revalidatePath("/pos");
}

const ERR_MAP: Record<string, string> = {
  duplicate: "duplicate",
  invalid: "invalid",
  "not-found": "not-found",
  "section-in-use": "section-in-use"
};

export async function saveTableSectionAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) floorRedirect({ error: "invalid-outlet" });

  const id = String(formData.get("id") ?? "") || undefined;
  const name = String(formData.get("name") ?? "");
  const sortOrder = Number(formData.get("sortOrder") ?? 1);

  const res = upsertTableSection({ id, outletId, name, sortOrder });
  if (!res.ok) floorRedirect({ outlet: outletId, error: ERR_MAP[res.error] ?? "save" });

  revalidateFloorPaths();
  floorRedirect({ outlet: outletId, ok: "section-saved" });
}

export async function toggleTableSectionAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";

  const res = toggleTableSectionActive(id, active);
  if (!res.ok) floorRedirect({ outlet: outletId, error: "not-found" });

  revalidateFloorPaths();
  floorRedirect({ outlet: outletId, ok: active ? "section-on" : "section-off" });
}

export async function saveFloorTableAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) floorRedirect({ error: "invalid-outlet" });

  const id = String(formData.get("id") ?? "") || undefined;
  const sectionId = String(formData.get("sectionId") ?? "");
  const label = String(formData.get("label") ?? "");
  const seats = Number(formData.get("seats") ?? 1);
  const sortOrder = Number(formData.get("sortOrder") ?? 1);

  const res = upsertFloorTable({ id, outletId, sectionId, label, seats, sortOrder });
  if (!res.ok) floorRedirect({ outlet: outletId, error: ERR_MAP[res.error] ?? "save" });

  revalidateFloorPaths();
  floorRedirect({ outlet: outletId, ok: "table-saved" });
}

export async function toggleFloorTableAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";

  const res = toggleFloorTableActive(id, active);
  if (!res.ok) floorRedirect({ outlet: outletId, error: "not-found" });

  revalidateFloorPaths();
  floorRedirect({ outlet: outletId, ok: active ? "table-on" : "table-off" });
}

export async function bootstrapFloorAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) floorRedirect({ error: "invalid-outlet" });

  resetFloorFromSeed(outletId);
  revalidateFloorPaths();
  floorRedirect({ outlet: outletId, ok: "bootstrapped" });
}
