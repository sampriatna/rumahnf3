import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { formatRupiah } from "@/lib/format-rupiah";
import { pullMasterBahan } from "@/lib/inventory-crud";
import { InventoryDataPageShell } from "@/components/inventory/InventoryDataPageShell";
import { ConfirmDeleteButton } from "@/components/inventory/ConfirmDeleteButton";
import { FlashMessage, fieldClass, labelClass } from "@/components/inventory/InventoryDataNav";
import { saveBahanAction, deleteBahanAction } from "../actions";

const ROLES = ["owner", "admin"];

export default async function MasterBahanPage({
  searchParams
}: {
  searchParams: { saved?: string; error?: string; edit?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!ROLES.includes(session.role)) redirect("/inventory");

  const rows = await pullMasterBahan();
  const editing = searchParams.edit ? rows.find((r) => r.kodeBahan === searchParams.edit) : undefined;

  return (
    <InventoryDataPageShell
      title="Master Bahan"
      subtitle={`${rows.length} bahan — dari import CSV & manual`}
      active="bahan"
    >
      <FlashMessage saved={searchParams.saved} error={searchParams.error} />

      <section className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          {editing ? `Edit ${editing.kodeBahan}` : "Tambah Bahan"}
        </h2>
        <form action={saveBahanAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input type="hidden" name="mode" value={editing ? "update" : "create"} />
          <div>
            <label className={labelClass}>Kode Bahan</label>
            <input
              name="kodeBahan"
              required
              defaultValue={editing?.kodeBahan ?? ""}
              readOnly={!!editing}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Nama Baku</label>
            <input name="namaBaku" required defaultValue={editing?.namaBaku ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Kategori</label>
            <input name="kategori" defaultValue={editing?.kategori ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Satuan Beli</label>
            <input name="satuanBeli" defaultValue={editing?.satuanBeli ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Satuan Pakai</label>
            <input name="satuanPakai" defaultValue={editing?.satuanPakai ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Konversi</label>
            <input name="konversi" type="number" step="any" defaultValue={editing?.konversi ?? 1} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Harga / Satuan Pakai (Rp)</label>
            <input
              name="hargaPerSatuanPakai"
              type="number"
              step="any"
              defaultValue={editing?.hargaPerSatuanPakai ?? 0}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Supplier Utama</label>
            <input name="supplierUtama" defaultValue={editing?.supplierUtama ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Stok Minimum</label>
            <input name="stokMinimum" type="number" step="any" defaultValue={editing?.stokMinimum ?? 0} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Stok Aman</label>
            <input name="stokAman" type="number" step="any" defaultValue={editing?.stokAman ?? 0} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Stok Maksimum</label>
            <input name="stokMaksimum" type="number" step="any" defaultValue={editing?.stokMaksimum ?? 0} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select name="statusAktif" defaultValue={editing?.statusAktif ?? "Aktif"} className={fieldClass}>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Metode Stok</label>
            <select name="metodeStok" defaultValue={editing?.metodeStok ?? "Distok"} className={fieldClass}>
              <option value="Distok">Distok</option>
              <option value="BeliHarian">Beli Harian</option>
            </select>
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              {editing ? "Simpan Perubahan" : "Tambah"}
            </button>
            {editing && (
              <Link href="/inventory/data/bahan" className="btn-secondary px-4 py-2 text-sm">
                Batal
              </Link>
            )}
          </div>
        </form>
      </section>

      <div className="overflow-x-auto">
        <table className="panel w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="p-3">Kode</th>
              <th className="p-3">Nama</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Harga/pakai</th>
              <th className="p-3">Min/Aman</th>
              <th className="p-3">Status</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.kodeBahan} className="border-b border-slate-50">
                <td className="p-3 font-mono text-xs font-bold">{r.kodeBahan}</td>
                <td className="p-3">{r.namaBaku}</td>
                <td className="p-3 text-slate-500">{r.kategori}</td>
                <td className="p-3">{formatRupiah(r.hargaPerSatuanPakai || null)}</td>
                <td className="p-3 text-xs">
                  {r.stokMinimum} / {r.stokAman}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-bold ${
                      r.statusAktif === "Aktif" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {r.statusAktif}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-3">
                    <Link
                      href={`/inventory/data/bahan?edit=${r.kodeBahan}`}
                      className="text-xs font-bold text-navy-800"
                    >
                      Edit
                    </Link>
                    <form action={deleteBahanAction}>
                      <input type="hidden" name="kodeBahan" value={r.kodeBahan} />
                      <ConfirmDeleteButton label={r.kodeBahan} />
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
