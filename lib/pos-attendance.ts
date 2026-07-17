import type { PosAttendanceRecord } from "./pos-kds-roadmap";
import { getPosBusinessDate } from "./pos-store-day";
import { store, nextId } from "./store";

export function formatAttendanceTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("id-ID", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getOpenAttendance(userId: string, outletId: string): PosAttendanceRecord | undefined {
  const today = getPosBusinessDate();
  return (store().posAttendanceRecords ?? []).find(
    (r) =>
      r.userId === userId &&
      r.outletId === outletId &&
      r.businessDate === today &&
      !r.clockOutAt
  );
}

export function listOutletAttendanceToday(outletId: string): PosAttendanceRecord[] {
  const today = getPosBusinessDate();
  return (store().posAttendanceRecords ?? []).filter(
    (r) => r.outletId === outletId && r.businessDate === today
  );
}

export function clockIn(input: {
  outletId: string;
  userId: string;
  userName: string;
  userRole: string;
  note?: string;
}): { error?: string; record?: PosAttendanceRecord } {
  const open = getOpenAttendance(input.userId, input.outletId);
  if (open) return { error: "Anda masih clock-in. Clock-out dulu sebelum absen masuk lagi." };

  const record: PosAttendanceRecord = {
    id: nextId("ATT"),
    outletId: input.outletId,
    userId: input.userId,
    userName: input.userName,
    userRole: input.userRole,
    businessDate: getPosBusinessDate(),
    clockInAt: new Date().toISOString(),
    note: input.note?.trim() || undefined
  };

  if (!store().posAttendanceRecords) store().posAttendanceRecords = [];
  store().posAttendanceRecords.unshift(record);
  return { record };
}

export function clockOut(input: {
  outletId: string;
  userId: string;
}): { error?: string; record?: PosAttendanceRecord } {
  const open = getOpenAttendance(input.userId, input.outletId);
  if (!open) return { error: "Belum clock-in hari ini." };

  open.clockOutAt = new Date().toISOString();
  return { record: open };
}

export function attendanceDurationMinutes(record: PosAttendanceRecord): number | null {
  if (!record.clockOutAt) return null;
  const ms = new Date(record.clockOutAt).getTime() - new Date(record.clockInAt).getTime();
  return Math.max(0, Math.round(ms / 60_000));
}
