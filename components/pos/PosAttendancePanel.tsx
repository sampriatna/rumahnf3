import type { PosAttendanceRecord } from "@/lib/pos-kds-roadmap";
import {
  attendanceDurationMinutes,
  formatAttendanceTime
} from "@/lib/pos-attendance";
import { clockInAction, clockOutAction } from "@/app/pos-actions";
import { getPosBusinessDate } from "@/lib/pos-store-day";
import { Clock, LogIn, LogOut } from "lucide-react";

function AttendanceRow({ record }: { record: PosAttendanceRecord }) {
  const duration = attendanceDurationMinutes(record);
  return (
    <li className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm">
      <span>
        <span className="font-bold text-navy-900">{record.userName}</span>
        <span className="mt-0.5 block text-xs text-slate-500 capitalize">{record.userRole}</span>
      </span>
      <span className="text-right text-xs">
        <span className="font-semibold text-navy-800">
          {formatAttendanceTime(record.clockInAt)}
          {record.clockOutAt ? ` – ${formatAttendanceTime(record.clockOutAt)}` : " – aktif"}
        </span>
        {duration != null && (
          <span className="mt-0.5 block text-slate-500">{duration} menit</span>
        )}
      </span>
    </li>
  );
}

export function PosAttendancePanel({
  outletId,
  userName,
  userRole,
  myOpen,
  todayRecords,
  ok,
  error
}: {
  outletId: string;
  userName: string;
  userRole: string;
  myOpen?: PosAttendanceRecord;
  todayRecords: PosAttendanceRecord[];
  ok?: string;
  error?: string;
}) {
  const businessDate = getPosBusinessDate();
  const dateLabel = new Date(`${businessDate}T12:00:00`).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta"
  });

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {ok === "clock-in" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Clock-in berhasil dicatat.
        </p>
      )}
      {ok === "clock-out" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Clock-out berhasil dicatat.
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error.includes("%") ? decodeURIComponent(error) : error}
        </p>
      )}

      <section className="pos-panel p-4">
        <h2 className="flex items-center gap-2 text-sm font-black text-navy-900">
          <Clock className="h-4 w-4" aria-hidden />
          Absen Hari Ini
        </h2>
        <p className="mt-1 text-xs text-slate-500">{dateLabel}</p>
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-bold text-navy-800">{userName}</span> · {userRole}
        </p>

        {myOpen ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-bold text-emerald-900">Status: Clock-in aktif</p>
            <p className="mt-1 text-xs text-emerald-800">
              Masuk pukul {formatAttendanceTime(myOpen.clockInAt)}
            </p>
            <form action={clockOutAction} className="mt-3">
              <input type="hidden" name="outletId" value={outletId} />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 px-4 py-3 text-sm font-bold text-white"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Clock-out
              </button>
            </form>
          </div>
        ) : (
          <form action={clockInAction} className="mt-4 grid gap-3">
            <input type="hidden" name="outletId" value={outletId} />
            <div>
              <label htmlFor="attendanceNote" className="nf3-field-label">
                Catatan (opsional)
              </label>
              <input
                id="attendanceNote"
                name="note"
                type="text"
                placeholder="Mis. shift pagi"
                className="nf3-input mt-1 font-semibold"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              Clock-in
            </button>
          </form>
        )}
      </section>

      <section className="pos-panel p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Rekap Outlet Hari Ini ({todayRecords.length})
        </h2>
        {todayRecords.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
            Belum ada absensi tercatat hari ini.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {todayRecords.map((r) => (
              <AttendanceRow key={r.id} record={r} />
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-slate-500">
        Absensi lokal POS. Integrasi squadnf3.id akan menyinkronkan data ke HR menyusul.
      </p>
    </div>
  );
}
