import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { getTransferRequest } from "@/lib/transfer-service";
import { TRANSFER_STATUS_LABEL, isTransferAwaitingSend } from "@/lib/transfer";
import { isGlobalRole } from "@/lib/data-scope";
import {
  sendTransferAction,
  receiveTransferAction,
  cancelTransferAction
} from "@/app/transfer-actions";
import { UI_FLAGS } from "@/lib/ui-flags";
import { TransferStatusBadge } from "@/components/inventory/TransferStatusBadge";

const VIEW_ROLES = ["leader", "owner", "admin"];

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function TransferDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const tr = getTransferRequest(params.id);
  if (!tr) notFound();

  const global = isGlobalRole(session.role, session.isSuperAdmin);
  if (!global && session.outletId && tr.toOutletId !== session.outletId) {
    redirect("/inventory/transfers");
  }

  const awaitingSend = isTransferAwaitingSend(tr.status);
  const canReceive =
    tr.status === "sent" && (global || session.outletId === tr.toOutletId);
  const invUi = UI_FLAGS.inventoryUiV1;

  return (
    <div className="max-w-2xl">
      <Link href="/inventory/transfers" className="text-sm font-bold text-navy-700">
        ← Daftar Transfer
      </Link>

      <header className="mb-6 mt-3">
        <h1 className="text-2xl font-black text-navy-900">{tr.requestNumber}</h1>
        <p className="mt-1 text-slate-600">
          {tr.fromLocationLabel} → {tr.toOutletName ?? tr.toOutletId}
        </p>
      </header>

      {searchParams.ok && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          Berhasil diperbarui.
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-800">
          {searchParams.error}
        </p>
      )}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Status</p>
        {invUi ? (
          <div className="mt-2">
            <TransferStatusBadge status={tr.status} />
          </div>
        ) : (
          <p className="mt-1 text-xl font-black text-navy-900">
            {TRANSFER_STATUS_LABEL[tr.status]}
          </p>
        )}
        {tr.note && <p className="mt-2 text-sm text-slate-600">Catatan: {tr.note}</p>}
        {awaitingSend && (
          <p className="mt-2 text-xs text-slate-500">
            Transfer rutin — tidak perlu approval owner. Admin/gudang kirim barang setelah request masuk.
          </p>
        )}
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">Barang</h2>
        <ul className="space-y-1 text-sm text-slate-800">
          {tr.items.map((line, i) => (
            <li key={i}>
              {line.itemName} — <strong>{line.qty}</strong> {line.unit}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-6 space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-700 shadow-sm">
        <p>
          <span className="font-bold">Diajukan:</span> {tr.requestedByName} · {formatTime(tr.createdAt)}
        </p>
        <p>
          <span className="font-bold">Dikirim gudang:</span> {tr.sentByName ?? "—"} ·{" "}
          {formatTime(tr.sentAt)}
        </p>
        <p>
          <span className="font-bold">Diterima outlet:</span> {tr.receivedByName ?? "—"} ·{" "}
          {formatTime(tr.receivedAt)}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {global && awaitingSend && (
          <>
            <form action={sendTransferAction}>
              <input type="hidden" name="id" value={tr.id} />
              <button type="submit" className="btn-primary px-4 py-2 text-sm">
                Kirim dari Gudang
              </button>
            </form>
            <form action={cancelTransferAction}>
              <input type="hidden" name="id" value={tr.id} />
              <button type="submit" className="btn-secondary px-4 py-2 text-sm">
                Batalkan
              </button>
            </form>
          </>
        )}

        {canReceive && (
          <form action={receiveTransferAction}>
            <input type="hidden" name="id" value={tr.id} />
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              Konfirmasi Diterima
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
