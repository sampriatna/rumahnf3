import { formatRp } from "@/lib/finance";
import type { QuietHourOutletStatus } from "@/lib/ops-quiet-hour";
import { checkQuietHourAction } from "@/app/ops-actions";

export function QuietHourPanel({
  status,
  showActions = true
}: {
  status: QuietHourOutletStatus | null;
  showActions?: boolean;
}) {
  if (!status) {
    return (
      <div className="panel p-4 text-sm text-slate-500">
        Monitor jam sepi aktif pukul 08:00–22:00.
      </div>
    );
  }

  return (
    <section className="panel p-5">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Jam Sepi · POS</h2>
          <p className="text-sm text-slate-600">
            {status.dayLabel}
            {status.isWeekend ? " · weekend (ekspektasi lebih ramai)" : " · hari kerja"} · window{" "}
            {status.windowLabel}
          </p>
        </div>
        {status.isQuiet ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
            Sepi
          </span>
        ) : (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
            Normal
          </span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="text-xs font-bold text-slate-500">2 jam terakhir</p>
          <p className="mt-1 font-black text-navy-900">
            {status.windowActualOrders} order · {Math.round(status.windowPct * 100)}% dari normal{" "}
            {status.dayLabel}
          </p>
          <p className="text-xs text-slate-500">
            Ekspektasi ~{status.windowExpectedOrders} order ·{" "}
            {formatRp(Math.round(status.windowExpectedRevenue))}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 text-sm">
          <p className="text-xs font-bold text-slate-500">Hari ini (kumulatif)</p>
          <p className="mt-1 font-black text-navy-900">
            {status.todayActualOrders} order · {Math.round(status.todayPct * 100)}% dari normal{" "}
            {status.dayLabel}
          </p>
          <p className="text-xs text-slate-500">Ekspektasi ~{status.todayExpectedOrders} order</p>
        </div>
      </div>

      {status.isQuiet && status.reasons.length > 0 && (
        <ul className="mt-3 list-inside list-disc text-sm text-amber-900">
          {status.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      )}

      {status.isQuiet && status.suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase text-slate-500">Saran konten / promo</p>
          <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-navy-900">
            {status.suggestions.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </div>
      )}

      {showActions && status.isQuiet && (
        <form action={checkQuietHourAction} className="mt-4 flex flex-wrap items-center gap-3">
          <input type="hidden" name="outletId" value={status.outletId} />
          {!status.canAlert && (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" name="force" className="rounded" />
              Kirim ulang (abaikan cooldown 3 jam)
            </label>
          )}
          <button type="submit" className="btn-primary px-4 py-2 text-sm">
            {status.canAlert ? "Kirim WA ke Leader" : "Kirim WA ke Leader (force)"}
          </button>
          {status.lastAlertAt && (
            <span className="text-xs text-slate-500">
              Alert terakhir: {new Date(status.lastAlertAt).toLocaleString("id-ID")}
            </span>
          )}
        </form>
      )}

      {!status.isQuiet && (
        <p className="mt-3 text-xs text-slate-500">
          Bandingkan dengan rata-rata historis hari {status.dayLabel} yang sama — bukan flat harian.
        </p>
      )}
    </section>
  );
}
