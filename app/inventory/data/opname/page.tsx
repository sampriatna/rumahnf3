import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { pullOpnameAwal, pullMasterBahan, pullMasterLokasi } from "@/lib/inventory-crud";
import { InventoryDataPageShell } from "@/components/inventory/InventoryDataPageShell";
import { ConfirmDeleteButton } from "@/components/inventory/ConfirmDeleteButton";
import { FlashMessage, fieldClass, labelClass } from "@/components/inventory/InventoryDataNav";
import { saveOpnameAction, deleteOpnameAction } from "../actions";

const ROLES = ["owner", "admin"];

function dateInput(iso: string) {
  return iso?.slice(0, 10) ?? "";
}

export default async function OpnameDataPage({
  searchParams
}: {
  searchParams: { saved?: string; error?: string; edit?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!ROLES.includes(session.role)) redirect("/inventory");

  const [rows, bahan, lokasi] = await Promise.all([
    pullOpnameAwal(),
    pullMasterBahan(),
    pullMasterLokasi()
  ]);
  const sorted = [...rows].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const editing = searchParams.edit ? sorted.find((r) => r.id === searchParams.edit) : undefined;

  return (
    <InventoryDataPageShell
      title="Opname Awal"
      subtitle={`${sorted.length} saldo awal per lokasi`}
      active="opname"
      maxWidth="max-w-6xl"
    >
      <FlashMessage saved={searchParams.saved} error={searchParams.error} />

      <section className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          {editing ? `Edit ${editing.id}` : "Tambah Opname Awal"}
        </h2>
        <form action={saveOpnameAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <label className={labelClass}>Lokasi</label>
            <select name="lokasi" required defaultValue={editing?.lokasi ?? ""} className={fieldClass}>
              <option value="">— pilih —</option>
              {lokasi.map((l) => (
                <option key={l.kode} value={l.kode}>
                  {l.kode}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Qty Awal</label>
            <input
              name="qtyAwal"
              type="number"
              step="any"
              required
              defaultValue={editing?.qtyAwal ?? ""}
              className={fieldClass}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              {editing ? "Simpan" : "Tambah"}
            </button>
            {editing && (
              <Link href="/inventory/data/opname" className="btn-secondary px-4 py-2 text-sm">
                Batal
              </Link>
            )}
          </div>
        </form>
      </section>

      <div className="overflow-x-auto">
        <table className="panel w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="p-3">Tanggal</th>
              <th className="p-3">Bahan</th>
              <th className="p-3">Lokasi</th>
              <th className="p-3">Qty Awal</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  Belum ada opname awal.
                </td>
              </tr>
            ) : (
              sorted.map((r) => (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="p-3">{dateInput(r.tanggal)}</td>
                  <td className="p-3 font-mono text-xs">{r.kodeBahan}</td>
                  <td className="p-3">{r.lokasi}</td>
                  <td className="p-3">{r.qtyAwal}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <Link href={`/inventory/data/opname?edit=${r.id}`} className="text-xs font-bold text-navy-800">
                        Edit
                      </Link>
                      <form action={deleteOpnameAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmDeleteButton label="opname" />
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
