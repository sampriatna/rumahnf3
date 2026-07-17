import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { assessProdReadiness } from "@/lib/prod-readiness";
import { recentCronRuns } from "@/lib/store";
import { TASK_DASHBOARD_URL } from "@/lib/constants";
import { portalAppUrl, posAppUrl, kdsAppUrl, staffAppUrl } from "@/lib/subdomains";
import { DomainBookmarkCard } from "@/components/settings/DomainBookmarkCard";

const VIEW_ROLES = ["owner", "admin"];

export default function SystemSettingsPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const report = assessProdReadiness();
  const cronRuns = recentCronRuns(undefined, 8);
  const portalDashboard = portalAppUrl("/dashboard");
  const posLogin = posAppUrl("/pos/login");
  const kdsHome = kdsAppUrl("/");
  const staffLogin = staffAppUrl("/login");

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader
        title="Sistem & Production"
        subtitle="Checklist deploy Vercel, cron jam sepi, dan bookmark tablet kasir."
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pengaturan" },
          { label: "Sistem" }
        ]}
      />

      <section className="panel mb-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Status deploy</h2>
          {report.ready ? (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Siap production
            </span>
          ) : (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              Perlu perbaikan env
            </span>
          )}
        </div>
        <p className="text-sm text-slate-600">
          Environment: <strong>{report.environment}</strong>
          {report.isProduction && report.requiredMissing.length > 0 && (
            <> · Kurang: {report.requiredMissing.join(", ")}</>
          )}
        </p>
        <ul className="mt-4 space-y-2">
          {report.checks.map((c) => (
            <li key={c.id} className="flex gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
              <span className={c.ok ? "text-emerald-600" : c.required ? "text-rose-600" : "text-amber-600"}>
                {c.ok ? "✓" : c.required ? "✗" : "○"}
              </span>
              <div>
                <p className="font-semibold text-navy-900">
                  {c.label}
                  {c.required && !c.ok && report.isProduction && (
                    <span className="ml-2 text-xs font-normal text-rose-600">wajib</span>
                  )}
                </p>
                <p className="text-xs text-slate-500">{c.hint}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Health check publik: <code className="rounded bg-slate-100 px-1">GET /api/health</code> — untuk
          uptime monitor Vercel/UptimeRobot.
        </p>
      </section>

      <section className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Cron jam sepi (Vercel)
        </h2>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            Schedule UTC: <code className="rounded bg-slate-100 px-1">0 2 * * *</code> ≈{" "}
            <strong>09:00 WIB</strong> sekali sehari (Hobby Vercel — upgrade Pro untuk tiap jam).
          </p>
          <p>
            Endpoint: <code className="rounded bg-slate-100 px-1">GET /api/cron/quiet-hour</code> dengan
            header{" "}
            <code className="rounded bg-slate-100 px-1">Authorization: Bearer &lt;CRON_SECRET&gt;</code>
          </p>
          <p className="text-xs text-slate-500">
            Di production, tanpa CRON_SECRET cron ditolak (503). Vercel Cron otomatis kirim header ini bila
            env terisi.
          </p>
        </div>
        {cronRuns.length > 0 ? (
          <div className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-100">
            {cronRuns.map((r, i) => (
              <div key={`${r.at}-${i}`} className="flex justify-between gap-2 px-3 py-2 text-xs">
                <span className="font-mono text-slate-600">{r.job}</span>
                <span className={r.ok ? "text-emerald-700" : "text-rose-700"}>
                  {new Date(r.at).toLocaleString("id-ID")} · {r.ok ? "OK" : "GAGAL"}
                  {r.detail ? ` · ${r.detail}` : ""}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-500">Belum ada log cron — akan terisi setelah deploy + cron jalan.</p>
        )}
      </section>

      <section className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Domain & bookmark outlet
        </h2>
        <div className="space-y-3 text-sm">
          <DomainBookmarkCard
            title="Command Center"
            url={portalDashboard}
            description="Leader, admin, owner — approval, laporan, AI."
          />
          <DomainBookmarkCard
            title="POS Kasir (tablet)"
            url={posLogin}
            description="Bookmark di home screen tablet (PWA) — subdomain pos.nf3.company."
          />
          <DomainBookmarkCard
            title="Kitchen Display (KDS)"
            url={kdsHome}
            description="Tablet dapur — login HP+PIN staf KDS, subdomain kds.nf3.company."
          />
          <DomainBookmarkCard
            title="Portal Staf (HP pribadi)"
            url={staffLogin}
            description="Form, SOP, slip gaji — subdomain staff.nf3.company."
          />
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="font-bold text-navy-900">Catatin ↔ Owner Report</p>
            <p className="text-slate-600">
              Laporan kasir harian tampil di <strong>/reports/owner</strong> saat integrasi aktif.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Admin: set env <code className="text-xs">NF3_CATATIN_BUSINESS_ID</code> di Vercel.
            </p>
          </div>
          <DomainBookmarkCard
            title="Task Dashboard (external)"
            url={TASK_DASHBOARD_URL}
            description="Task lintas outlet — aplikasi terpisah, tidak di-rebuild di sini."
          />
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Arsitektur subdomain: <strong>rumah.nf3.company</strong> (command center) ·{" "}
          <strong>staff.nf3.company</strong> (staf) · <strong>pos.nf3.company</strong> (kasir) ·{" "}
          <strong>kds.nf3.company</strong> (dapur).
        </p>
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Langkah deploy Vercel
        </h2>
        <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
          <li>Push repo ke GitHub → import di Vercel.</li>
          <li>
            Set env production: <code className="text-xs">SESSION_SECRET</code>,{" "}
            <code className="text-xs">CRON_SECRET</code>, Supabase keys,{" "}
            <code className="text-xs">NEXT_PUBLIC_APP_URL</code>,{" "}
            <code className="text-xs">NF3_CATATIN_BUSINESS_ID</code> (laporan kasir), WA provider (opsional).
          </li>
          <li>
            Deploy — <code className="text-xs">vercel.json</code> sudah berisi cron jam sepi.
          </li>
          <li>
            Lokal cek env: <code className="text-xs">npm run check:prod</code>
          </li>
          <li>Tablet kasir: buka pos.nf3.company → Add to Home Screen.</li>
          <li>Tablet dapur: buka kds.nf3.company → login HP+PIN → Add to Home Screen.</li>
        </ol>
      </section>
    </main>
  );
}
