import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { buildDailyReport, formatRp as formatRpReport } from "@/lib/reports";
import { getFinanceSummary } from "@/lib/finance-service";
import { formatRp } from "@/lib/finance";
import { loadCatatinDailyReports } from "@/lib/catatin-daily-reports";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { CatatinDailyReportsPanel } from "@/components/reports/CatatinDailyReportsPanel";
import { MetricLabel } from "@/components/MetricLabel";
import { METRIC_HINTS } from "@/lib/metric-hints";
import { UI_FLAGS } from "@/lib/ui-flags";
import { buildPosSalesSnapshot } from "@/lib/pos-report-snapshot";
import {
  isPortalAllOutletsScope,
  resolvePortalOutletScope
} from "@/lib/portal-outlet-scope";
import { PosSalesPanel } from "@/components/reports/PosSalesPanel";
import { StatCard } from "@/components/ui/StatCard";

export default async function OwnerReportPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (session.role !== "owner" && session.role !== "admin") redirect("/dashboard");

  const [report, finance, catatin] = await Promise.all([
    Promise.resolve(buildDailyReport()),
    Promise.resolve(getFinanceSummary()),
    loadCatatinDailyReports(14)
  ]);
  const scopeOutletId = isPortalAllOutletsScope(session)
    ? undefined
    : resolvePortalOutletScope(session);
  const posSales = UI_FLAGS.uiOpsV1 ? buildPosSalesSnapshot(scopeOutletId) : null;

  const kpiItems = [
    { label: "Form Hari Ini", value: String(report.totals.submissionsToday) },
    { label: "Approval Pending", value: String(report.totals.pendingApprovals) },
    {
      label: "Request Macet",
      value: String(report.totals.stuckCount),
      metricHint: METRIC_HINTS.requestMacet,
      tone: "warning" as const
    },
    { label: "Request Bahan Open", value: String(report.totals.requestBahanPending) },
    { label: "Waste Hari Ini", value: String(report.totals.wasteCount) },
    {
      label: "Kendala Hari Ini",
      value: String(report.totals.kendalaCount),
      metricHint: METRIC_HINTS.kendalaHariIni
    },
    {
      label: "Setoran Hari Ini",
      value: formatRpReport(report.totals.setoranTotal),
      subHint: report.totals.setoranTotal > 0 ? undefined : "Belum ada setoran",
      metricHint: METRIC_HINTS.setoranHariIni
    },
    { label: "Kas Tersedia", value: formatRp(finance.kasTersedia) },
    { label: "Free Cash", value: formatRp(finance.freeCash) },
    { label: "Utang 7 Hari", value: formatRp(finance.utangJatuhTempo) }
  ];

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <PageHeader
        title="Owner Report"
        subtitle={`Ringkasan keputusan hari ini · ${report.dateLabel}`}
      />

      <CatatinDailyReportsPanel
        load={catatin}
        showTechnicalDetails={session.role === "admin" || session.isSuperAdmin === true}
      />

      {posSales && <PosSalesPanel snapshot={posSales} />}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {UI_FLAGS.uiOpsV1
          ? kpiItems.map((w) => (
              <StatCard
                key={w.label}
                label={w.label}
                value={w.value}
                hint={w.subHint}
                tone={w.tone}
              />
            ))
          : kpiItems.map((w) => (
              <div key={w.label} className="panel p-4">
                <p className="text-xs font-semibold text-slate-500">
                  <MetricLabel label={w.label} hint={w.metricHint} />
                </p>
                <p className="mt-1 text-lg font-black text-navy-900">{w.value}</p>
                {w.subHint && <p className="mt-1 text-[10px] text-slate-400">{w.subHint}</p>}
              </div>
            ))}
      </div>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Operasional NF3 (form & approval)
        </h2>
        <div className="overflow-x-auto">
          <table className="panel w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
                <th className="p-3">Outlet</th>
                <th className="p-3">Form</th>
                <th className="p-3" title={METRIC_HINTS.requestMacet}>
                  Macet
                </th>
                <th className="p-3">Bahan Open</th>
                <th className="p-3">Waste</th>
                <th className="p-3">Approval</th>
              </tr>
            </thead>
            <tbody>
              {report.byOutlet.map((o) => (
                <tr key={o.outletId} className="border-b border-slate-50">
                  <td className="p-3 font-semibold text-navy-900">{o.outletName}</td>
                  <td className="p-3">{o.submissionsToday}</td>
                  <td className="p-3">{o.stuckCount}</td>
                  <td className="p-3">{o.requestBahanPending}</td>
                  <td className="p-3">{o.wasteCount}</td>
                  <td className="p-3">{o.pendingApprovals}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {report.stuckItems.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Request Macet
          </h2>
          <div className="grid gap-3">
            {report.stuckItems.map((s) => (
              <div key={s.id} className="panel flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-navy-900">{s.formLabel}</p>
                  <p className="text-xs text-slate-400">
                    {s.outletName} · {s.submittedByName} · {s.id}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {report.wasteHighlights.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Waste Tertinggi Hari Ini
          </h2>
          <div className="grid gap-2">
            {report.wasteHighlights.map((w, i) => (
              <div key={i} className="panel p-3 text-sm">
                <span className="font-bold text-navy-900">{w.outlet}</span> — {w.bahan} ({w.jumlah}) ·{" "}
                {w.alasan}
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href="/ai" className="btn-primary">
          AI Direktur — Analisa Hari Ini
        </Link>
        <Link href="/finance" className="btn-secondary">
          Kas & Free Cash
        </Link>
      </div>
    </main>
  );
}
