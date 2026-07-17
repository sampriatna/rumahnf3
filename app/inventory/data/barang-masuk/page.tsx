import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { formatRupiah } from "@/lib/format-rupiah";
import { pullBarangMasuk, pullMasterBahan, pullMasterLokasi, pullMasterSupplier } from "@/lib/inventory-crud";
import { InventoryDataPageShell } from "@/components/inventory/InventoryDataPageShell";
import { ConfirmDeleteButton } from "@/components/inventory/ConfirmDeleteButton";
import { FlashMessage, fieldClass, labelClass } from "@/components/inventory/InventoryDataNav";
import { saveBarangMasukAction, deleteBarangMasukAction } from "../actions";

const ROLES = ["owner", "admin"];

function dateInput(iso: string) {
  return iso?.slice(0, 10) ?? "";
}

export default async function BarangMasukPage({
  searchParams
}: {
  searchParams: { saved?: string; error?: string; edit?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!ROLES.includes(session.role)) redirect("/inventory");

  const [rows, bahan, lokasi, supplier] = await Promise.all([
    pullBarangMasuk(),
    pullMasterBahan(),
    pullMasterLokasi(),
    pullMasterSupplier()
  ]);
  const sorted = [...rows].sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const editing = searchParams.edit ? sorted.find((r) => r.id === searchParams.edit) : undefined;
  const bahanMap = new Map(bahan.map((b) => [b.kodeBahan, b]));

  return (
    <InventoryDataPageShell
      title="Barang Masuk"
      subtitle={`${sorted.length} transaksi — data dari CSV template & input manual`}
      active="barang-masuk"
      maxWidth="max-w-6xl"
    >
      <FlashMessage saved={searchParams.saved} error={searchParams.error} />

      <section className="panel mb-6 p-5">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
          {editing ? `Edit ${editing.id}` : "Tambah Barang Masuk"}
        </h2>
        <form action={saveBarangMasukAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <label className={labelClass}>Satuan</label>
            <input name="satuan" defaultValue={editing?.satuan ?? ""} className={fieldClass} />
          </div>
          <div>
            <label className={labelClass}>Total Harga (Rp)</label>
            <input
              name="totalHarga"
              type="number"
              step="any"
              defaultValue={editing?.totalHarga ?? 0}
              className={fieldClass}
            />
          </div>
          <div>
            <label className={labelClass}>Supplier</label>
            <select name="supplier" defaultValue={editing?.supplier ?? supplier[0]?.nama ?? ""} className={fieldClass}>
              {supplier.map((s) => (
                <option key={s.kode} value={s.nama}>
                  {s.nama}
                </option>
              ))}
              {editing?.supplier && !supplier.some((s) => s.nama === editing.supplier) && (
                <option value={editing.supplier}>{editing.supplier}</option>
              )}
            </select>
          </div>
          <div>
            <label className={labelClass}>Lokasi Tujuan</label>
            <select name="lokasiTujuan" required defaultValue={editing?.lokasiTujuan ?? "GDG"} className={fieldClass}>
              {lokasi.map((l) => (
                <option key={l.kode} value={l.kode}>
                  {l.kode} — {l.namaLokasi}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Diterima Oleh</label>
            <input name="diterimaOleh" defaultValue={editing?.diterimaOleh ?? session.name} className={fieldClass} />
          </div>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              {editing ? "Simpan Perubahan" : "Tambah"}
            </button>
            {editing && (
              <Link href="/inventory/data/barang-masuk" className="btn-secondary px-4 py-2 text-sm">
                Batal
              </Link>
            )}
          </div>
        </form>
      </section>

      <div className="overflow-x-auto">
        <table className="panel w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase text-slate-500">
              <th className="p-3">Tanggal</th>
              <th className="p-3">Bahan</th>
              <th className="p-3">Qty</th>
              <th className="p-3">Total</th>
              <th className="p-3">Lokasi</th>
              <th className="p-3">Supplier</th>
              <th className="p-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const b = bahanMap.get(r.kodeBahan);
              return (
                <tr key={r.id} className="border-b border-slate-50">
                  <td className="p-3 whitespace-nowrap">{dateInput(r.tanggal)}</td>
                  <td className="p-3">
                    <span className="font-mono text-xs font-bold">{r.kodeBahan}</span>
                    {b && <span className="ml-1 text-slate-500">{b.namaBaku}</span>}
                  </td>
                  <td className="p-3">
                    {r.qty} {r.satuan}
                  </td>
                  <td className="p-3">{formatRupiah(r.totalHarga || null)}</td>
                  <td className="p-3 font-mono text-xs">{r.lokasiTujuan}</td>
                  <td className="p-3 text-slate-500">{r.supplier}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <Link href={`/inventory/data/barang-masuk?edit=${r.id}`} className="text-xs font-bold text-navy-800">
                        Edit
                      </Link>
                      <form action={deleteBarangMasukAction}>
                        <input type="hidden" name="id" value={r.id} />
                        <ConfirmDeleteButton label={`barang masuk ${dateInput(r.tanggal)}`} />
                      </form>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </InventoryDataPageShell>
  );
}
