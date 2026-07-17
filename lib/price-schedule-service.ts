import type { MenuItem } from "./pos-kds-roadmap";
import { store, nextId, persistStore } from "./store";
import { isPosOutlet } from "./pos-seed";
import { PRICE_SCHEDULE_SEED } from "./price-schedule-seed";
import { bumpMenuCatalogVersion } from "./catalog-meta";

export type PriceAdjustType = "fixed_price" | "percent_off";

export type MenuPriceSchedule = {
  id: string;
  outletId: string;
  name: string;
  /** 0=Min … 6=Sen (Date.getDay()). */
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  adjustType: PriceAdjustType;
  value: number;
  targetMenuItemIds: string[];
  targetCategoryIds: string[];
  sortOrder: number;
  active: boolean;
};

export type PriceScheduleSaveError = "duplicate" | "invalid" | "not-found";

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function parseTimeMinutes(raw: string): number | null {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function normalizeTime(raw: string) {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return raw.trim();
  return `${String(Number(m[1])).padStart(2, "0")}:${m[2]}`;
}

export function isPriceScheduleActive(schedule: MenuPriceSchedule, now = new Date()) {
  if (!schedule.active) return false;
  if (schedule.daysOfWeek.length && !schedule.daysOfWeek.includes(now.getDay())) return false;

  const start = parseTimeMinutes(schedule.startTime);
  const end = parseTimeMinutes(schedule.endTime);
  if (start == null || end == null) return false;

  const cur = now.getHours() * 60 + now.getMinutes();
  if (start === end) return false;
  if (start < end) return cur >= start && cur < end;
  return cur >= start || cur < end;
}

function itemMatchesSchedule(item: MenuItem, schedule: MenuPriceSchedule) {
  if (schedule.targetMenuItemIds.includes(item.id)) return true;
  if (item.categoryId && schedule.targetCategoryIds.includes(item.categoryId)) return true;
  if (!schedule.targetMenuItemIds.length && !schedule.targetCategoryIds.length) return true;
  return false;
}

export function ensurePriceSchedulesReady(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  const has = store().menuPriceSchedules.some((s) => s.outletId === outletId);
  if (!has) bootstrapPriceSchedulesFromSeed(outletId);
}

export function bootstrapPriceSchedulesFromSeed(outletId?: string) {
  const rows = outletId
    ? PRICE_SCHEDULE_SEED.filter((r) => r.outletId === outletId)
    : PRICE_SCHEDULE_SEED;
  rows.forEach((row, i) => {
    upsertPriceSchedule({
      outletId: row.outletId,
      name: row.name,
      daysOfWeek: row.daysOfWeek,
      startTime: row.startTime,
      endTime: row.endTime,
      adjustType: row.adjustType,
      value: row.value,
      targetMenuItemIds: row.targetMenuItemIds ?? [],
      targetCategoryIds: row.targetCategoryIds ?? [],
      sortOrder: i + 1,
      active: true
    });
  });
  persistStore();
}

export function resetPriceSchedulesFromSeed(outletId: string) {
  store().menuPriceSchedules = store().menuPriceSchedules.filter((s) => s.outletId !== outletId);
  bootstrapPriceSchedulesFromSeed(outletId);
  bumpMenuCatalogVersion(outletId);
}

export function listPriceSchedules(outletId: string, includeInactive = false): MenuPriceSchedule[] {
  ensurePriceSchedulesReady(outletId);
  return store()
    .menuPriceSchedules.filter((s) => s.outletId === outletId && (includeInactive || s.active))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function listActivePriceSchedulesNow(outletId: string, now = new Date()) {
  return listPriceSchedules(outletId).filter((s) => isPriceScheduleActive(s, now));
}

export function getPriceSchedule(id: string) {
  return store().menuPriceSchedules.find((s) => s.id === id);
}

export function upsertPriceSchedule(input: {
  id?: string;
  outletId: string;
  name: string;
  daysOfWeek: number[];
  startTime: string;
  endTime: string;
  adjustType: PriceAdjustType;
  value: number;
  targetMenuItemIds?: string[];
  targetCategoryIds?: string[];
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; schedule: MenuPriceSchedule }
  | { ok: false; error: PriceScheduleSaveError } {
  const name = normalizeName(input.name);
  if (!name || input.value < 0) return { ok: false, error: "invalid" };
  if (input.adjustType === "percent_off" && input.value > 100) return { ok: false, error: "invalid" };
  if (parseTimeMinutes(input.startTime) == null || parseTimeMinutes(input.endTime) == null) {
    return { ok: false, error: "invalid" };
  }

  const s = store();
  const dup = s.menuPriceSchedules.find(
    (x) =>
      x.outletId === input.outletId &&
      x.id !== input.id &&
      x.name.toLowerCase() === name.toLowerCase()
  );
  if (dup) return { ok: false, error: "duplicate" };

  const existing = input.id ? s.menuPriceSchedules.find((x) => x.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const schedule: MenuPriceSchedule = {
    id: existing?.id ?? nextId("ps"),
    outletId: input.outletId,
    name,
    daysOfWeek: input.daysOfWeek.length ? input.daysOfWeek : [0, 1, 2, 3, 4, 5, 6],
    startTime: normalizeTime(input.startTime),
    endTime: normalizeTime(input.endTime),
    adjustType: input.adjustType,
    value: input.value,
    targetMenuItemIds: input.targetMenuItemIds ?? existing?.targetMenuItemIds ?? [],
    targetCategoryIds: input.targetCategoryIds ?? existing?.targetCategoryIds ?? [],
    sortOrder:
      input.sortOrder ??
      existing?.sortOrder ??
      s.menuPriceSchedules.filter((x) => x.outletId === input.outletId).length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) Object.assign(existing, schedule);
  else s.menuPriceSchedules.push(schedule);

  bumpMenuCatalogVersion(input.outletId);
  persistStore();
  return { ok: true, schedule };
}

export function togglePriceScheduleActive(outletId: string, id: string, active: boolean) {
  const schedule = getPriceSchedule(id);
  if (!schedule || schedule.outletId !== outletId) {
    return { ok: false as const, error: "not-found" as const };
  }
  schedule.active = active;
  bumpMenuCatalogVersion(outletId);
  persistStore();
  return { ok: true as const, schedule };
}

export function resolveScheduledPrice(
  basePrice: number,
  item: MenuItem,
  outletId: string,
  now = new Date()
): number {
  ensurePriceSchedulesReady(outletId);
  const active = listActivePriceSchedulesNow(outletId, now);
  for (const sch of active) {
    if (!itemMatchesSchedule(item, sch)) continue;
    if (sch.adjustType === "fixed_price") return Math.max(0, Math.round(sch.value));
    return Math.max(0, Math.round((basePrice * (100 - sch.value)) / 100));
  }
  return basePrice;
}

export function getActiveScheduleForItem(item: MenuItem, outletId: string, now = new Date()) {
  ensurePriceSchedulesReady(outletId);
  for (const sch of listActivePriceSchedulesNow(outletId, now)) {
    if (itemMatchesSchedule(item, sch)) return sch;
  }
  return undefined;
}

export { DAY_LABELS, formatScheduleDays } from "./price-schedule-utils";
