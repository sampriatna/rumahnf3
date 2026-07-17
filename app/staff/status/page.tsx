import { redirect } from "next/navigation";
import { Inbox } from "lucide-react";
import { getSession } from "@/lib/session";
import { listByUser } from "@/lib/store";
import { StaffPage } from "@/components/staff/StaffPage";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertBanner } from "@/components/ui/AlertBanner";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function StatusPage({ searchParams }: { searchParams: { ok?: string } }) {
  const session = getSession();
  if (!session) redirect("/login");

  const items = listByUser(session.sub);
  const justSent = searchParams.ok === "1";

  return (
    <StaffPage>
      <StaffHeader title="Status Request Saya" subtitle="Pantau request yang sudah kamu kirim." />

      {justSent && (
        <AlertBanner tone="success" className="mb-5">
          Request berhasil dikirim. Pantau statusnya di bawah.
        </AlertBanner>
      )}

      {items.length === 0 ? (
        <div className="staff-empty">
          <Inbox className="h-8 w-8 text-slate-300" aria-hidden />
          <p>Belum ada request. Kirim lewat menu &quot;Isi Form&quot;.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((s) => {
            const last = s.history[s.history.length - 1];
            return (
              <div key={s.id} className="staff-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-navy-900">{s.formLabel}</h3>
                    <p className="text-xs text-slate-400">
                      {s.id} · {formatTime(s.createdAt)}
                      {s.outletName ? ` · ${s.outletName}` : ""}
                    </p>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <dl className="nf3-kv-grid mt-3">
                  {Object.entries(s.payload)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k} className="nf3-kv-row">
                        <dt className="text-slate-500">{k.replace(/_/g, " ")}:</dt>
                        <dd className="font-medium text-slate-800">{v}</dd>
                      </div>
                    ))}
                </dl>

                {last?.note && (
                  <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Update terakhir oleh {last.byName}: {last.note}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </StaffPage>
  );
}
