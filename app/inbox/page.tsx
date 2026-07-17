import Link from "next/link";
import { redirect } from "next/navigation";
import { Inbox as InboxIcon } from "lucide-react";
import { getSession } from "@/lib/session";
import { listApprovals, listForScope } from "@/lib/store";
import { OUTLETS } from "@/lib/mock-data";
import { STATUS_META, type RequestStatus } from "@/lib/feedback";
import {
  INBOX_GROUPS,
  countInboxByGroup,
  filterInboxByGroup,
  type InboxGroupId
} from "@/lib/inbox-groups";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { updateStatus } from "../form-actions";

const HANDLER_ROLES = ["leader", "owner", "admin"];
const STATUS_OPTIONS: RequestStatus[] = [
  "menunggu_dicek",
  "diproses",
  "disetujui",
  "ditolak",
  "perlu_revisi",
  "selesai"
];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

function resolveGroup(raw?: string): InboxGroupId {
  const valid = INBOX_GROUPS.some((g) => g.id === raw);
  return valid ? (raw as InboxGroupId) : "semua";
}

export default function InboxPage({ searchParams }: { searchParams?: { grup?: string } }) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!HANDLER_ROLES.includes(session.role)) redirect("/dashboard");

  const activeGroup = resolveGroup(searchParams?.grup);

  const scopeOutlet = session.role === "leader" ? session.outletId : undefined;
  const allItems = listForScope(scopeOutlet);
  const approvals = listApprovals();
  const counts = countInboxByGroup(allItems, approvals);
  const items = filterInboxByGroup(allItems, activeGroup, approvals);

  const scopeName =
    session.role === "leader"
      ? OUTLETS.find((o) => o.id === session.outletId)?.name ?? "Outlet kamu"
      : "Semua outlet";

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <PageHeader title="Request & Laporan Masuk" subtitle={`Cakupan: ${scopeName}`} />

      <p className="mb-4 text-sm text-slate-600">
        Request yang butuh approval formal → kelola di{" "}
        <Link href="/approvals" className="font-bold text-navy-700 underline">
          Approval Center
        </Link>
        .
      </p>

      <nav
        className="mb-6 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]"
        aria-label="Filter status request"
      >
        {INBOX_GROUPS.map((group) => {
          const active = activeGroup === group.id;
          const count = counts[group.id];
          return (
            <Link
              key={group.id}
              href={group.id === "semua" ? "/inbox" : `/inbox?grup=${group.id}`}
              className={`shrink-0 px-3 py-1.5 transition ${
                active
                  ? "nf3-chip-active"
                  : "nf3-chip hover:bg-slate-200"
              }`}
            >
              {group.label}
              <span className={`ml-1.5 ${active ? "text-gold-300" : "text-slate-400"}`}>
                ({count})
              </span>
            </Link>
          );
        })}
      </nav>

      {items.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 p-10 text-center text-slate-500">
          <InboxIcon className="h-8 w-8" aria-hidden />
          <p>
            {allItems.length === 0
              ? "Belum ada request/laporan masuk."
              : "Tidak ada request di filter ini."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((s) => {
            const last = s.history[s.history.length - 1];
            return (
              <div key={s.id} className="panel p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-navy-900">
                      {s.formLabel}
                      {s.needsApproval && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                          PERLU APPROVAL
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {s.id} · {s.submittedByName} · {formatTime(s.createdAt)}
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

                {s.photoName && (
                  <p className="mt-2 text-xs text-slate-500">Foto: {s.photoName}</p>
                )}
                {last?.note && (
                  <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    {last.byName}: {last.note}
                  </p>
                )}

                <form
                  action={updateStatus}
                  className="mt-4 flex flex-wrap items-end gap-2 border-t border-slate-100 pt-4"
                >
                  <input type="hidden" name="id" value={s.id} />
                  <div>
                    <label className="nf3-field-label">Ubah Status</label>
                    <select
                      name="status"
                      defaultValue={s.status}
                      className="nf3-select mt-1"
                    >
                      {STATUS_OPTIONS.map((st) => (
                        <option key={st} value={st}>
                          {STATUS_META[st].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    name="note"
                    placeholder="Catatan (opsional)"
                    className="nf3-input min-w-[180px] flex-1"
                  />
                  <button type="submit" className="btn-primary px-4 py-2 text-sm">
                    Simpan Perubahan
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
