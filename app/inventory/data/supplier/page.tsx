import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { pullMasterSupplier } from "@/lib/inventory-crud";
import { InventoryDataPageShell } from "@/components/inventory/InventoryDataPageShell";
import { ConfirmDeleteButton } from "@/components/inventory/ConfirmDeleteButton";
import { FlashMessage, fieldClass, labelClass } from "@/components/inventory/InventoryDataNav";
import { saveSupplierAction, deleteSupplierAction } from "../actions";

const ROLES = ["owner", "admin"];

const KATEGORI = ["Sembako/Frozen", "Sayur & Sembako", "Bahan Fresh", "Plastik & Kemasan", "Lainnya"];
const HARI = ["Harian", "Mingguan", "Bulanan"];

export default async function MasterSupplierPage({
  searchParams
}: {
  searchParams: { saved?: string; error?: string; edit?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!ROLES.includes(session.role)) redirect("/inventory");

  const rows = await pullMasterSupplier();
  const editing = searchParams.edit ? rows.find((r) => r.kode === searchParams.edit) : undefined;

  return (
    <InventoryDataPageShell
      title="Master Supplier"
      subtitle="Daftar supplier untuk barang masuk & purchasing"
      active="supplier"
      maxWidth="max-w-4xl"
    >
      <FlashMessage saved={searchParams.saved} error={searchParams.error} />

      <section className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          {editing ? `Edit ${editing.kode}` : "Tambah Supplier"}
        </h2>
        <form action={saveSupplierAction} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="mode" value={editing ? "update" : "create"} />
          <div>
            <label className={labelClass}>Kode</label>
            <input
              name="kode"
              required
              defaultValue={editing?.kode ?? ""}
              readOnly={!!editing}
              className={fieldClass}
              placeholder="SUP-001"
            />
          </div>
          <div>
            <label className={labelClass}>Nama</label>
            <input name="nama" required defaultValue={editing?.nama ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Kategori</label>
            <select name="kategori" defaultValue={editing?.kategori ?? KATEGORI[0]} className={fieldClass}>
              {KATEGORI.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Hari Order</label>
            <select name="hariOrder" defaultValue={editing?.hariOrder ?? "Harian"} className={fieldClass}>
              {HARI.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              {editing ? "Simpan Perubahan" : "Tambah"}
            </button>
            {editing && (
              <Link href="/inventory/data/supplier" className="btn-secondary px-4 py-2 text-sm">
                Batal
              </Link>
            )}
          </div>
        </form>
      </section>

      <div className="overflow-x-auto">
        <table className="panel w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="p-3">Kode</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Hari Order</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kode} className="border-b border-slate-50">
                <td className="p-3 font-mono font-bold">{r.kode}</td>
                <td className="p-3">{r.nama}</td>
                <td className="p-3 text-slate-500">{r.kategori}</td>
                <td className="p-3 text-slate-500">{r.hariOrder}</td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <Link
                      href={`/inventory/data/supplier?edit=${r.kode}`}
                      className="text-xs font-bold text-navy-800"
                    >
                      Edit
                    </Link>
                    <form action={deleteSupplierAction}>
                      <input type="hidden" name="kode" value={r.kode} />
                      <ConfirmDeleteButton label={r.kode} />
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="p-6 text-center text-slate-500">
                  Belum ada supplier. Tambah manual atau jalankan seed SQL.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </InventoryDataPageShell>
  );
}
