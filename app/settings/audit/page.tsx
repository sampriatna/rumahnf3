import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/PageHeader";
import { listAuditLog, auditLogSummary } from "@/lib/audit-log";
import { OpStatusBadge } from "@/components/ui/OpStatusBadge";

const VIEW_ROLES = ["owner", "admin"];

export default function AuditLogPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const summary = auditLogSummary();
  const events = listAuditLog(80);

  return (
    <main className="mx-auto max-w-4xl px-5 py-8">
      <PageHeader
        title="Audit Log"
        subtitle="Riwayat aksi sensitif (void, diskon, shift, inventori, approval)."
        backHref="/dashboard"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Pengaturan" },
          { label: "Audit Log" }
        ]}
      />

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <OpStatusBadge tone={summary.enabled ? "ready" : "muted"}>
          {summary.enabled ? "Audit aktif" : "Audit nonaktif (NF3_FF_AUDIT_LOG_FOUNDATION)"}
        </OpStatusBadge>
        <span className="text-slate-600">{summary.totals.events} event tersimpan (buffer memori)</span>
      </div>

      {events.length === 0 ? (
        <div className="panel p-8 text-center text-sm text-slate-600">
          Belum ada event audit tercatat di sesi ini.
        </div>
      ) : (
        <ul className="panel divide-y divide-slate-100 overflow-hidden">
          {events.map((e) => (
            <li key={e.id} className="px-4 py-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-navy-900">{e.action}</p>
                  <p className="text-xs text-slate-500">
                    {e.actorName} · {e.entityType} {e.entityId}
                    {e.outletId ? ` · ${e.outletId}` : ""}
                  </p>
                  {e.reason && <p className="mt-1 text-xs text-slate-600">{e.reason}</p>}
                </div>
                <time className="shrink-0 text-[11px] text-slate-400">
                  {new Date(e.at).toLocaleString("id-ID")}
                </time>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs text-slate-500">
        Integrasi eksternal (QRIS gateway, GoFood API, absensi squadnf3.id) belum tersedia — gunakan
        input manual di POS Online.{" "}
        <Link href="/settings/system" className="font-bold text-navy-700 underline">
          Pengaturan sistem
        </Link>
      </p>
    </main>
  );
}
