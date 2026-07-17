"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  upsertPriceSchedule,
  togglePriceScheduleActive,
  resetPriceSchedulesFromSeed,
  type PriceAdjustType
} from "@/lib/price-schedule-service";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

function requireLibraryRole() {
  const session = getSession();
  if (!session || !LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");
  return session;
}

function redirectSchedules(params: Record<string, string>) {
  const q = new URLSearchParams(params).toString();
  redirect(`/library/price-schedules${q ? `?${q}` : ""}`);
}

function revalidatePaths() {
  revalidatePath("/library/price-schedules");
  revalidatePath("/pos");
}

export async function savePriceScheduleAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectSchedules({ error: "invalid-outlet" });

  const daysOfWeek = formData
    .getAll("daysOfWeek")
    .map((d) => Number(d))
    .filter((n) => !Number.isNaN(n) && n >= 0 && n <= 6);

  const targetMenuItemIds = String(formData.get("targetMenuItemIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const targetCategoryIds = String(formData.get("targetCategoryIds") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const res = upsertPriceSchedule({
    id: String(formData.get("id") ?? "") || undefined,
    outletId,
    name: String(formData.get("name") ?? ""),
    daysOfWeek,
    startTime: String(formData.get("startTime") ?? ""),
    endTime: String(formData.get("endTime") ?? ""),
    adjustType: String(formData.get("adjustType") ?? "percent_off") as PriceAdjustType,
    value: Number(formData.get("value") ?? 0),
    targetMenuItemIds,
    targetCategoryIds,
    sortOrder: Number(formData.get("sortOrder") ?? 1)
  });

  if (!res.ok) {
    redirectSchedules({
      outlet: outletId,
      error: res.error === "duplicate" ? "duplicate" : "invalid"
    });
  }

  revalidatePaths();
  redirectSchedules({ outlet: outletId, ok: "saved" });
}

export async function togglePriceScheduleAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "1";
  const res = togglePriceScheduleActive(outletId, id, active);
  if (!res.ok) redirectSchedules({ outlet: outletId, error: "not-found" });
  revalidatePaths();
  redirectSchedules({ outlet: outletId, ok: active ? "on" : "off" });
}

export async function bootstrapPriceSchedulesAction(formData: FormData) {
  requireLibraryRole();
  const outletId = String(formData.get("outletId") ?? "");
  if (!isPosOutlet(outletId)) redirectSchedules({ error: "invalid-outlet" });
  resetPriceSchedulesFromSeed(outletId);
  revalidatePaths();
  redirectSchedules({ outlet: outletId, ok: "bootstrapped" });
}
