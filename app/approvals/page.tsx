import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  filterApprovalsForRole,
  canDecideApproval,
  APPROVAL_STATUS_META
} from "@/lib/approval";
import { listApprovals, getSubmission, listNotificationLogs } from "@/lib/store";
import { PageHeader } from "@/components/PageHeader";
import { ApprovalBadge } from "@/components/ApprovalBadge";
import { AlertBanner } from "@/components/ui/AlertBanner";
import { decideApproval } from "../approval-actions";

const HANDLER_ROLES = ["leader", "owner", "admin"];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function formatRp(n?: number) {
  if (n == null) return null;
  return `Rp ${n.toLocaleString("id-ID")}`;
}

export default function ApprovalsPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!HANDLER_ROLES.includes(session.role)) redirect("/dashboard");

  const all = listApprovals();
  const items = filterApprovalsForRole(all, session.role, session.outletId);
  const pending = items.filter((a) => a.status === "pending");
  const decided = items.filter((a) => a.status !== "pending");
  const waLogs = listNotificationLogs(10);

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader
        title="Approval"
        subtitle={
          session.role === "leader"
            ? "Setujui izin, request bahan, setoran & opname outlet kamu."
            : "Semua approval, termasuk yang butuh keputusan owner."
        }
      />

      {searchParams.error === "unauthorized" && (
        <AlertBanner tone="danger">
          Kamu tidak punya akses memutus approval ini.
        </AlertBanner>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          Menunggu Keputusan ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <div className="panel p-8 text-center text-sm text-slate-500">Tidak ada approval pending.</div>
        ) : (
          <div className="grid gap-4">
            {pending.map((a) => {
              const sub = getSubmission(a.requestId);
              const canAct = canDecideApproval(session.role, a, session.outletId);
              return (
                <div key={a.id} className="panel p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-navy-900">{a.requestLabel}</h3>
                      <p className="text-xs text-slate-400">
                        {a.id} · {a.requestedByName} · {formatTime(a.createdAt)}
                        {a.outletName ? ` · ${a.outletName}` : ""}
                      </p>
                    </div>
                    <ApprovalBadge status={a.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    {a.approverLevel === "owner" && (
                      <span className="rounded bg-rose-100 px-2 py-0.5 font-bold text-rose-700">
                        Butuh Owner
                      </span>
                    )}
                    {a.approverLevel === "leader" && (
                      <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-700">
                        Leader Outlet
                      </span>
                    )}
                    {formatRp(a.amount) && (
                      <span className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                        {formatRp(a.amount)}
                      </span>
                    )}
                  </div>

                  {a.reason && (
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-semibold">Alasan:</span> {a.reason}
                    </p>
                  )}

                  {sub && (
                    <dl className="nf3-kv-grid mt-3">
                      {Object.entries(sub.payload)
                        .filter(([, v]) => v)
                        .slice(0, 6)
                        .map(([k, v]) => (
                          <div key={k} className="nf3-kv-row">
                            <dt className="text-slate-500">{k.replace(/_/g, " ")}:</dt>
                            <dd className="font-medium text-slate-800">{v}</dd>
                          </div>
                        ))}
                    </dl>
                  )}

                  {canAct ? (
                    <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                      <form action={decideApproval} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="id" value={a.id} />
                        <input type="hidden" name="decision" value="approved" />
                        <input
                          name="note"
                          placeholder="Catatan (opsional)"
                          className="nf3-input min-w-[180px] flex-1"
                        />
                        <button type="submit" className="btn-primary px-4 py-2 text-sm">
                          Setujui
                        </button>
                      </form>
                      <div className="flex flex-wrap gap-2">
                        <form action={decideApproval}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="decision" value="need_revision" />
                          <input type="hidden" name="note" value="Perlu diperbaiki/dilengkapi." />
                          <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                            Perlu Diperbaiki
                          </button>
                        </form>
                        <form action={decideApproval}>
                          <input type="hidden" name="id" value={a.id} />
                          <input type="hidden" name="decision" value="rejected" />
                          <input type="hidden" name="note" value="Ditolak." />
                          <button
                            type="submit"
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"
                          >
                            Tolak
                          </button>
                        </form>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 text-xs font-semibold text-amber-700">
                      Menunggu keputusan {a.approverLevel === "owner" ? "Owner" : "Leader"}.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {decided.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Riwayat Keputusan
          </h2>
          <div className="grid gap-3">
            {decided.slice(0, 10).map((a) => (
              <div key={a.id} className="panel flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-slate-800">{a.requestLabel}</p>
                  <p className="text-xs text-slate-400">
                    {a.approvedByName} · {APPROVAL_STATUS_META[a.status].label} · {formatTime(a.updatedAt)}
                  </p>
                </div>
                <ApprovalBadge status={a.status} />
              </div>
            ))}
          </div>
        </section>
      )}

      {(session.role === "owner" || session.role === "admin") && waLogs.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
            Log Notifikasi WA (10 terakhir)
          </h2>
          <div className="grid gap-2">
            {waLogs.map((log) => (
              <div key={log.id} className="panel p-3 text-xs">
                <p className="font-mono text-slate-400">
                  {formatTime(log.createdAt)} · {log.event} → {log.target} · {log.status}
                </p>
                <pre className="mt-1 whitespace-pre-wrap font-sans text-slate-600">{log.message}</pre>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
