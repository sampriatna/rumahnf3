import Link from "next/link";
import { redirect } from "next/navigation";
import { Send } from "lucide-react";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { getItems } from "@/lib/inventory-service";
import { listTransferRequests } from "@/lib/transfer-service";
import { isGlobalRole } from "@/lib/data-scope";
import { createTransferAction } from "@/app/transfer-actions";
import { WAREHOUSE_LABEL } from "@/lib/inventory";
import { InventoryPageHeader } from "@/components/inventory/InventoryPageHeader";
import { toOutletSlug } from "@/lib/outlet-identity";
import { UI_FLAGS } from "@/lib/ui-flags";
import { TransferCard, TransferPipeline } from "@/components/inventory/TransferCard";

const VIEW_ROLES = ["leader", "owner", "admin"];

export default function TransfersPage({
  searchParams
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const sessionOutlet = toOutletSlug(session.outletId) ?? session.outletId;
  const scope = session.role === "leader" ? sessionOutlet : undefined;
  const transfers = listTransferRequests(scope);
  const items = getItems();
  const global = isGlobalRole(session.role, session.isSuperAdmin);
  const outletOptions = global ? OUTLETS : OUTLETS.filter((o) => o.id === sessionOutlet);
  const defaultOutlet = sessionOutlet ?? outletOptions[0]?.id ?? "";
  const invUi = UI_FLAGS.inventoryUiV1;

  return (
    <div className="max-w-5xl">
      <InventoryPageHeader
        title="Transfer Stok"
        subtitle={`Kirim barang dari ${WAREHOUSE_LABEL} (GDG) ke outlet. Tanpa approval owner.`}
      />

      {invUi ? (
        <TransferPipeline />
      ) : (
        <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          {[
            { n: 1, label: "Ajukan", desc: "Leader minta barang" },
            { n: 2, label: "Kirim", desc: "Gudang proses" },
            { n: 3, label: "Terima", desc: "Outlet konfirmasi" }
          ].map((step, i, arr) => (
            <div key={step.n} className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
                {step.n}
              </span>
              <div className="text-xs">
                <p className="font-bold text-navy-900">{step.label}</p>
                <p className="text-slate-500">{step.desc}</p>
              </div>
              {i < arr.length - 1 && (
                <span className="mx-1 hidden text-slate-300 sm:inline" aria-hidden>
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {searchParams.ok && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
          Berhasil disimpan.
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200">
          {searchParams.error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-100 text-navy-800">
              <Send className="h-4 w-4" aria-hidden />
            </span>
            <h2 className="text-sm font-bold text-navy-900">Ajukan transfer baru</h2>
          </div>
          <form action={createTransferAction} className="grid gap-4">
            <div>
              <label htmlFor="toOutletId" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Outlet tujuan
              </label>
              <select
                id="toOutletId"
                name="toOutletId"
                defaultValue={defaultOutlet}
                disabled={!global && Boolean(session.outletId)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                required
              >
                {outletOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.code} — {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="itemId" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Barang
              </label>
              <select
                id="itemId"
                name="itemId"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                required
              >
                <option value="">— Pilih barang —</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.itemName} ({it.unit})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="qty" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Jumlah
                </label>
                <input
                  id="qty"
                  name="qty"
                  type="number"
                  min={0.01}
                  step="any"
                  required
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
              <div>
                <label htmlFor="note" className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Catatan
                </label>
                <input
                  id="note"
                  name="note"
                  type="text"
                  placeholder="Opsional"
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm shadow-sm focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary w-full rounded-xl py-3 sm:w-auto">
              Ajukan Transfer
            </button>
          </form>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy-900">Daftar transfer</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
              {transfers.length}
            </span>
          </div>
          {transfers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              Belum ada request transfer.
            </div>
          ) : (
            <div className="grid max-h-[520px] gap-2 overflow-y-auto pr-1">
              {transfers.map((tr) =>
                invUi ? (
                  <TransferCard key={tr.id} transfer={tr} />
                ) : (
                  <Link
                    key={tr.id}
                    href={`/inventory/transfers/${tr.id}`}
                    className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-gold-400 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-navy-900 group-hover:text-navy-700">
                          {tr.requestNumber}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {tr.toOutletName ?? tr.toOutletId} ·{" "}
                          {new Date(tr.createdAt).toLocaleDateString("id-ID", { dateStyle: "medium" })}
                        </p>
                        <ul className="mt-2 space-y-0.5 text-sm text-slate-700">
                          {tr.items.map((line, i) => (
                            <li key={i}>
                              {line.itemName} — {line.qty} {line.unit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Link>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
