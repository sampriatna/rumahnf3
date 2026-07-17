import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { buildRatingReport } from "@/lib/reports";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import type { RequestStatus } from "@/lib/feedback";

export default function RatingsReportPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!["leader", "owner", "admin"].includes(session.role)) redirect("/dashboard");

  const scope = session.role === "leader" ? session.outletId : undefined;
  const report = buildRatingReport(scope);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader
        title="Rating & Kendala"
        subtitle="Keluhan & laporan kendala dari tim (sumber: Lapor Kendala). Google Review menyusul."
      />

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="panel p-4 text-center">
          <p className="text-xs text-slate-500">Total Laporan</p>
          <p className="text-2xl font-black text-navy-900">{report.total}</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-xs text-slate-500">Belum Ditangani</p>
          <p className="text-2xl font-black text-amber-600">{report.belumDitangani}</p>
        </div>
        <div className="panel p-4 text-center">
          <p className="text-xs text-slate-500">Kategori Teratas</p>
          <p className="text-lg font-black text-navy-900">
            {report.byCategory[0]?.category ?? "—"}
          </p>
        </div>
      </div>

      {report.byCategory.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Keluhan Paling Sering
          </h2>
          <div className="grid gap-2">
            {report.byCategory.map((c) => (
              <div key={c.category} className="panel flex items-center justify-between p-3 text-sm">
                <span className="font-semibold text-slate-800">{c.category}</span>
                <span className="rounded-full bg-slate-100 px-3 py-0.5 text-xs font-bold text-slate-600">
                  {c.count}x
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {report.byOutlet.length > 1 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Per Outlet</h2>
          <div className="grid gap-2 sm:grid-cols-2">
            {report.byOutlet.map((o) => (
              <div key={o.outlet} className="panel p-3 text-sm">
                <span className="font-semibold">{o.outlet}</span>
                <span className="ml-2 text-slate-500">{o.count} laporan</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Laporan Terbaru
        </h2>
        {report.rows.length === 0 ? (
          <div className="panel p-8 text-center text-sm text-slate-500">Belum ada laporan kendala.</div>
        ) : (
          <div className="grid gap-3">
            {report.rows.map((r) => (
              <div key={r.id} className="panel p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-navy-900">{r.category}</p>
                    <p className="text-xs text-slate-400">
                      {r.outlet} · {r.source} · {new Date(r.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                  <StatusBadge status={r.status as RequestStatus} />
                </div>
                <p className="mt-2 text-sm text-slate-600">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link href={session.role === "owner" ? "/reports/owner" : "/dashboard"} className="btn-secondary mt-8 inline-flex">
        Kembali
      </Link>
    </main>
  );
}
