import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { pullMasterLokasi } from "@/lib/inventory-crud";
import { InventoryDataPageShell } from "@/components/inventory/InventoryDataPageShell";
import { ConfirmDeleteButton } from "@/components/inventory/ConfirmDeleteButton";
import { FlashMessage, fieldClass, labelClass } from "@/components/inventory/InventoryDataNav";
import { saveLokasiAction, deleteLokasiAction } from "../actions";

const ROLES = ["owner", "admin"];

export default async function MasterLokasiPage({
  searchParams
}: {
  searchParams: { saved?: string; error?: string; edit?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!ROLES.includes(session.role)) redirect("/inventory");

  const rows = await pullMasterLokasi();
  const editing = searchParams.edit ? rows.find((r) => r.kode === searchParams.edit) : undefined;

  return (
    <InventoryDataPageShell
      title="Master Lokasi"
      subtitle="Kode lokasi stok (GDG, outlet, dll.)"
      active="lokasi"
      maxWidth="max-w-4xl"
    >
      <FlashMessage saved={searchParams.saved} error={searchParams.error} />

      <section className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          {editing ? `Edit ${editing.kode}` : "Tambah Lokasi"}
        </h2>
        <form action={saveLokasiAction} className="grid gap-3 sm:grid-cols-3">
          <input type="hidden" name="mode" value={editing ? "update" : "create"} />
          <div>
            <label className={labelClass}>Kode</label>
            <input
              name="kode"
              required
              defaultValue={editing?.kode ?? ""}
              readOnly={!!editing}
              className={fieldClass}
              placeholder="GDG"
            />
          </div>
          <div>
            <label className={labelClass}>Nama Lokasi</label>
            <input name="namaLokasi" required defaultValue={editing?.namaLokasi ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Jenis</label>
            <input name="jenis" defaultValue={editing?.jenis ?? "Gudang"} className={fieldClass} />
          </div>
          <div className="flex gap-2 sm:col-span-3">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              {editing ? "Simpan Perubahan" : "Tambah"}
            </button>
            {editing && (
              <Link href="/inventory/data/lokasi" className="btn-secondary px-4 py-2 text-sm">
                Batal
              </Link>
            )}
          </div>
        </form>
      </section>

      <div className="overflow-x-auto">
        <table className="panel w-full min-w-[480px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="p-3">Kode</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kode} className="border-b border-slate-50">
                <td className="p-3 font-mono font-bold">{r.kode}</td>
                <td className="p-3">{r.namaLokasi}</td>
                <td className="p-3 text-slate-500">{r.jenis}</td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <Link href={`/inventory/data/lokasi?edit=${r.kode}`} className="text-xs font-bold text-navy-800">
                      Edit
                    </Link>
                    <form action={deleteLokasiAction}>
                      <input type="hidden" name="kode" value={r.kode} />
                      <ConfirmDeleteButton label={r.kode} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </InventoryDataPageShell>
  );
}
