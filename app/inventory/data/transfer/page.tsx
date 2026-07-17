import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { pullTransferStok, pullMasterBahan, pullMasterLokasi } from "@/lib/inventory-crud";
import { InventoryDataPageShell } from "@/components/inventory/InventoryDataPageShell";
import { ConfirmDeleteButton } from "@/components/inventory/ConfirmDeleteButton";
import { FlashMessage, fieldClass, labelClass } from "@/components/inventory/InventoryDataNav";
import { saveTransferAction, deleteTransferAction } from "../actions";

const ROLES = ["owner", "admin"];

function dateInput(iso: string) {
  return iso?.slice(0, 10) ?? "";
}

export default async function TransferDataPage({
  searchParams
}: {
  searchParams: { saved?: string; error?: string; edit?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!ROLES.includes(session.role)) redirect("/inventory");

  const [rows, bahan, lokasi] = await Promise.all([
    pullTransferStok(),
    pullMasterBahan(),
    pullMasterLokasi()
  ]);
  const sorted = [...rows].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const editing = searchParams.edit ? sorted.find((r) => r.id === searchParams.edit) : undefined;

  return (
    <InventoryDataPageShell
      title="Transfer (Ledger)"
      subtitle={`${sorted.length} baris — koreksi manual, bukan workflow harian`}
      active="transfer"
      maxWidth="max-w-6xl"
    >
      <FlashMessage saved={searchParams.saved} error={searchParams.error} />

      <section className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          {editing ? `Edit ${editing.id}` : "Tambah Transfer"}
        </h2>
        <form action={saveTransferAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="hidden" name="mode" value={editing ? "update" : "create"} />
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div>
            <label className={labelClass}>Tanggal</label>
            <input
              name="tanggal"
              type="date"
              required
              defaultValue={dateInput(editing?.tanggal ?? new Date().toISOString())}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Kode Bahan</label>
            <select name="kodeBahan" required defaultValue={editing?.kodeBahan ?? ""} className={fieldClass}>
              <option value="">— pilih —</option>
              {bahan.map((b) => (
                <option key={b.kodeBahan} value={b.kodeBahan}>
                  {b.kodeBahan} — {b.namaBaku}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Qty</label>
            <input name="qty" type="number" step="any" required defaultValue={editing?.qty ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Dari Lokasi</label>
            <select name="dariLokasi" required defaultValue={editing?.dariLokasi ?? "GDG"} className={fieldClass}>
              {lokasi.map((l) => (
                <option key={l.kode} value={l.kode}>
                  {l.kode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Ke Lokasi</label>
            <select name="keLokasi" required defaultValue={editing?.keLokasi ?? ""} className={fieldClass}>
              <option value="">— pilih —</option>
              {lokasi.map((l) => (
                <option key={l.kode} value={l.kode}>
                  {l.kode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Dikeluarkan Oleh</label>
            <input name="dikeluarkanOleh" defaultValue={editing?.dikeluarkanOleh ?? session.name} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Diterima Oleh</label>
            <input name="diterimaOleh" defaultValue={editing?.diterimaOleh ?? ""} className={fieldClass} />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              {editing ? "Simpan" : "Tambah"}
            </button>
            {editing && (
              <Link href="/inventory/data/transfer" className="btn-secondary px-4 py-2 text-sm">
                Batal
              </Link>
            )}
          </div>
        </form>
      </section>

      <div className="overflow-x-auto">
        <table className="panel w-full min-w-[800px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="p-3">Tanggal</th>
              <th className="p-3">Bahan</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Dari → Ke</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  Belum ada transfer — tambah manual atau import dari Sheets.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="p-3">{dateInput(r.tanggal)}</td>
                  <td className="p-3 font-mono text-xs">{r.kodeBahan}</td>
                  <td className="p-3">{r.qty}</td>
                  <td className="p-3">
                    {r.dariLokasi} → {r.keLokasi}
                  </td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <Link href={`/inventory/data/transfer?edit=${r.id}`} className="text-xs font-bold text-navy-800">
                        Edit
                      </Link>
                      <form action={deleteTransferAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmDeleteButton label="transfer" />
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </InventoryDataPageShell>
  );
}
