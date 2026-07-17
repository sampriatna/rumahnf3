import {
  channelTotal,
  formatCatatinRp,
  type CatatinDailyReportsLoad
} from "@/lib/catatin-daily-reports";
import { AlertBanner } from "@/components/ui/AlertBanner";

const STATUS_LABEL: Record<string, string> = {
  submitted: "Submitted",
  settled: "Settled",
  draft: "Draft"
};

function formatDate(iso: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

export function CatatinDailyReportsPanel({
  load,
  showTechnicalDetails = false
}: {
  load: CatatinDailyReportsLoad;
  showTechnicalDetails?: boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const todayReports = load.reports.filter((r) => r.date === today || r.submittedAt?.startsWith(today));
  const todayTotal = todayReports.reduce((sum, r) => sum + channelTotal(r), 0);

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
            Laporan Harian Kasir (Catatin)
          </h2>
          <p className="mt-1 max-w-[52ch] text-xs text-slate-500">
            Omset dan setoran harian dari kasir — sinkron otomatis saat integrasi aktif.
          </p>
        </div>
        {load.updatedAt && (
          <p className="text-[10px] text-slate-400">
            Terakhir diperbarui{" "}
            {new Date(load.updatedAt).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" })}
          </p>
        )}
      </div>

      {load.source === "unconfigured" && (
        <div className="panel border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold text-navy-900">Data kasir belum tersambung</p>
          <p className="mt-1 text-xs text-slate-600">
            Laporan harian dari Catatin belum muncul di sini. Hubungi admin untuk mengaktifkan integrasi.
          </p>
          {showTechnicalDetails && (
            <details className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
              <summary className="cursor-pointer font-semibold text-slate-700">Status integrasi (admin)</summary>
              <p className="mt-2">{load.message}</p>
              <p className="mt-2">
                Set env <code className="rounded bg-slate-100 px-1">NF3_CATATIN_BUSINESS_ID</code> di Vercel
                (UUID bisnis Catatin). Data dibaca dari{" "}
                <code className="rounded bg-slate-100 px-1">app_state.data.dailyReports</code> — satu baris
                bersama kasir (RLS <code className="rounded bg-slate-100 px-1">is_business_member</code>).
              </p>
            </details>
          )}
        </div>
      )}

      {load.source === "error" && (
        <>
          <AlertBanner tone="danger">
            Gagal memuat laporan kasir. Coba muat ulang halaman. Jika masih gagal, hubungi admin.
          </AlertBanner>
          {showTechnicalDetails && load.message && (
            <p className="mt-2 rounded bg-white/80 px-2 py-1 font-mono text-[10px] text-rose-700">
              {load.message}
            </p>
          )}
        </>
      )}

      {load.source === "empty" && (
        <AlertBanner tone="info">
          Belum ada laporan kasir. Kasir belum submit laporan harian untuk periode ini.
        </AlertBanner>
      )}

      {load.source === "supabase" && load.reports.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="panel p-4">
              <p className="text-xs font-semibold text-slate-500">Submit hari ini</p>
              <p className="mt-1 text-lg font-black text-navy-900">{todayReports.length}</p>
            </div>
            <div className="panel p-4">
              <p className="text-xs font-semibold text-slate-500">Omset laporan hari ini</p>
              <p className="mt-1 text-lg font-black text-emerald-700">
                {todayTotal > 0 ? formatCatatinRp(todayTotal) : "—"}
              </p>
            </div>
            <div className="panel p-4">
              <p className="text-xs font-semibold text-slate-500">14 hari terakhir</p>
              <p className="mt-1 text-lg font-black text-navy-900">{load.reports.length} laporan</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="panel w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Outlet</th>
                  <th className="p-3">Kasir</th>
                  <th className="p-3">Omset</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {load.reports.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="p-3 text-slate-700">{formatDate(r.date || r.submittedAt || "")}</td>
                    <td className="p-3 font-semibold text-navy-900">{r.outlet}</td>
                    <td className="p-3 text-slate-700">{r.kasirName ?? r.kasirId ?? "—"}</td>
                    <td className="p-3 font-semibold text-emerald-800">
                      {channelTotal(r) > 0 ? formatCatatinRp(channelTotal(r)) : "—"}
                    </td>
                    <td className="p-3">
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-600">
                        {STATUS_LABEL[r.status ?? ""] ?? r.status ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {load.source === "supabase" && load.reports.length === 0 && (
        <div className="panel p-4 text-sm text-slate-600">
          <p className="font-semibold text-navy-900">Belum ada laporan dalam 14 hari terakhir</p>
          {showTechnicalDetails && load.businessId && (
            <p className="mt-1 text-xs">
              Business ID: <code className="rounded bg-slate-100 px-1">{load.businessId}</code>
            </p>
          )}
        </div>
      )}
    </section>
  );
}
