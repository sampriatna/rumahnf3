import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { buildDailyReport, staffActivity, formatRp } from "@/lib/reports";
import { OUTLETS } from "@/lib/mock-data";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { QuietHourPanel } from "@/components/ops/QuietHourPanel";
import { MenuPromoPanel } from "@/components/ops/MenuPromoPanel";
import {
  evaluateQuietHourForOutlet,
  ensureTrafficHistorySeeded,
  recentQuietHourAlerts
} from "@/lib/ops-quiet-hour";
import { analyzeMenuPromo, recentMenuPromoAlerts } from "@/lib/ops-menu-promo";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { UI_FLAGS } from "@/lib/ui-flags";
import { resolvePortalOutletScope } from "@/lib/portal-outlet-scope";
import { buildPosSalesSnapshot } from "@/lib/pos-report-snapshot";
import { PosSalesPanel } from "@/components/reports/PosSalesPanel";
import { StatCard } from "@/components/ui/StatCard";

export default function OutletReportPage({
  searchParams
}: {
  searchParams: { ok?: string; sent?: string; status?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!["leader", "owner", "admin"].includes(session.role)) redirect("/dashboard");

  const outletId =
    session.role === "leader"
      ? session.outletId
      : resolvePortalOutletScope(session);
  if (session.role === "leader" && !outletId) redirect("/dashboard");

  ensureTrafficHistorySeeded();

  const report = buildDailyReport(outletId);
  const outlet = outletId ? OUTLETS.find((o) => o.id === outletId) : undefined;
  const activity = outletId ? staffActivity(outletId) : [];
  const outletRow = report.byOutlet[0];

  const quietOutlets = outletId ? [outletId] : [...POS_OUTLET_IDS];
  const quietStatuses = quietOutlets
    .map((id) => evaluateQuietHourForOutlet(id))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  const recentAlerts = recentQuietHourAlerts(5);
  const menuPromoReports = quietOutlets
    .map((id) => analyzeMenuPromo(id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));
  const recentMenuAlerts = recentMenuPromoAlerts(3);
  const posSales = UI_FLAGS.uiOpsV1 ? buildPosSalesSnapshot(outletId) : null;

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader
        title="Dashboard Outlet"
        subtitle={
          outlet
            ? `${outlet.name} · ${report.dateLabel}`
            : `Semua outlet · ${report.dateLabel}`
        }
      />

      {searchParams.ok === "quiet-alert" && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Notifikasi jam sepi dikirim ke leader ({searchParams.sent ?? "1"} pesan · cek log di bawah).
        </div>
      )}
      {searchParams.ok === "menu-promo" && (
        <div className="mb-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Rekomendasi menu dikirim via WA · status: {searchParams.status ?? "logged"}.
        </div>
      )}
      {searchParams.ok === "no-menu-data" && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Belum ada cukup data penjualan per menu untuk rekomendasi.
        </div>
      )}
      {searchParams.ok === "not-quiet" && (
        <div className="mb-4 rounded-xl border border-blue-300 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Traffic masih dalam batas normal untuk hari ini.
        </div>
      )}

      <div className="mb-8 space-y-4">
        {quietStatuses.map((status) => (
          <QuietHourPanel key={status.outletId} status={status} />
        ))}
        {menuPromoReports.map((report) => (
          <MenuPromoPanel key={report.outletId} report={report} />
        ))}
      </div>

      {(recentAlerts.length > 0 || recentMenuAlerts.length > 0) && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Log WA Ops
          </h2>
          <div className="panel divide-y divide-slate-100">
            {[...recentAlerts, ...recentMenuAlerts]
              .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
              .slice(0, 8)
              .map((a) => (
                <div key={a.id} className="p-4 text-xs">
                  <p className="font-bold text-navy-800">
                    {new Date(a.createdAt).toLocaleString("id-ID")} · {a.event} · {a.status}
                    {a.providerError ? ` · ${a.providerError}` : ""}
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-slate-600">{a.message}</pre>
                </div>
              ))}
          </div>
        </section>
      )}

      {posSales && <PosSalesPanel snapshot={posSales} />}

      {outletRow && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {UI_FLAGS.uiOpsV1 ? (
            <>
              <StatCard label="Form Hari Ini" value={String(outletRow.submissionsToday)} />
              <StatCard label="Request Macet" value={String(outletRow.stuckCount)} tone="warning" />
              <StatCard label="Approval Pending" value={String(outletRow.pendingApprovals)} />
              <StatCard label="Request Bahan Open" value={String(outletRow.requestBahanPending)} />
              <StatCard label="Waste" value={String(outletRow.wasteCount)} />
              <StatCard label="Kendala" value={String(outletRow.kendalaCount)} />
              <StatCard
                label="Setoran"
                value={outletRow.setoranTotal > 0 ? formatRp(outletRow.setoranTotal) : "—"}
                hint={
                  outletRow.setoranSelisih > 0
                    ? `Selisih tercatat ${formatRp(outletRow.setoranSelisih)} — untuk verifikasi`
                    : undefined
                }
                tone="neutral"
              />
            </>
          ) : (
            <>
              {[
                { label: "Form Hari Ini", value: String(outletRow.submissionsToday) },
                { label: "Request Macet", value: String(outletRow.stuckCount) },
                { label: "Approval Pending", value: String(outletRow.pendingApprovals) },
                { label: "Request Bahan Open", value: String(outletRow.requestBahanPending) },
                { label: "Waste", value: String(outletRow.wasteCount) },
                { label: "Kendala", value: String(outletRow.kendalaCount) },
                {
                  label: "Setoran",
                  value: outletRow.setoranTotal > 0 ? formatRp(outletRow.setoranTotal) : "—"
                }
              ].map((w) => (
                <div key={w.label} className="panel p-4">
                  <p className="text-xs font-semibold text-slate-500">{w.label}</p>
                  <p className="mt-1 text-xl font-black text-navy-900">{w.value}</p>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {report.stuckItems.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Perlu Ditindaklanjuti
          </h2>
          <div className="grid gap-3">
            {report.stuckItems.map((s) => (
              <div key={s.id} className="panel flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-navy-900">{s.formLabel}</p>
                  <p className="text-xs text-slate-400">{s.submittedByName}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {activity.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Aktivitas Staf
          </h2>
          <div className="panel divide-y divide-slate-100">
            {activity.map((a) => (
              <div key={a.name} className="flex items-center justify-between p-4 text-sm">
                <span className="font-semibold text-navy-900">{a.name}</span>
                <span className="text-slate-500">{a.count} laporan</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/inbox" className="btn-primary">
          Buka Inbox
        </Link>
        <Link href="/approvals" className="btn-secondary">
          Approval
        </Link>
        {(session.role === "leader" || session.role === "owner") && (
          <Link href="/ai" className="btn-secondary">
            AI Briefing
          </Link>
        )}
      </div>
    </main>
  );
}
