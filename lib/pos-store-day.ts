import { store } from "./store";
import type { PosStoreDay } from "./pos-kds-roadmap";

function getOpenShiftForOutlet(outletId: string) {
  return store().posShifts.find((s) => s.outletId === outletId && s.status === "open");
}

/** Tanggal bisnis outlet (WIB). */
export function getPosBusinessDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function ensureStoreDay(outletId: string): PosStoreDay {
  const businessDate = getPosBusinessDate();
  const days = store().posStoreDays ?? [];
  let rec = days.find((d) => d.outletId === outletId && d.businessDate === businessDate);
  if (!rec) {
    rec = {
      outletId,
      businessDate,
      status: "open",
      openedAt: new Date().toISOString()
    };
    if (!store().posStoreDays) store().posStoreDays = [];
    store().posStoreDays!.push(rec);
  }
  return rec;
}

export function getStoreDayState(outletId: string): PosStoreDay {
  return ensureStoreDay(outletId);
}

export function isStoreClosedForDay(outletId: string): boolean {
  return getStoreDayState(outletId).status === "closed";
}

export function closeStoreDay(input: {
  outletId: string;
  closedBy: string;
}): { error?: string; day?: PosStoreDay } {
  if (getOpenShiftForOutlet(input.outletId)) {
    return { error: "Tutup shift aktif dulu sebelum tutup toko." };
  }
  const day = ensureStoreDay(input.outletId);
  if (day.status === "closed") {
    return { error: "Toko sudah ditutup hari ini." };
  }
  const now = new Date().toISOString();
  day.status = "closed";
  day.closedAt = now;
  day.closedBy = input.closedBy;
  return { day };
}

export function openStoreDay(input: {
  outletId: string;
  openedBy: string;
}): { error?: string; day?: PosStoreDay } {
  const day = ensureStoreDay(input.outletId);
  if (day.status === "open") {
    return { error: "Toko sudah buka hari ini." };
  }
  const now = new Date().toISOString();
  day.status = "open";
  day.openedAt = now;
  day.openedBy = input.openedBy;
  day.closedAt = undefined;
  day.closedBy = undefined;
  return { day };
}
