"use client";

import { useState } from "react";
import { Plus, Pencil, Package } from "lucide-react";
import type { MenuPackage, MenuPackageItem } from "@/lib/package-service";
import type { MenuItem } from "@/lib/pos-kds-roadmap";
import { formatRp } from "@/lib/finance";
import { Modal } from "@/components/ui/Modal";
import {
  saveMenuPackageAction,
  toggleMenuPackageAction,
  bootstrapPackagesAction
} from "@/app/library/package-actions";

export type PackageRow = MenuPackage & { summary: string; items: MenuPackageItem[] };

export function PackageLibraryClient({
  outletId,
  packages,
  menuItems
}: {
  outletId: string;
  packages: PackageRow[];
  menuItems: MenuItem[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<MenuPackage | null>(null);
  const [editItems, setEditItems] = useState<MenuPackageItem[]>([]);

  const openNew = () => {
    setEditPkg(null);
    setEditItems([]);
    setModalOpen(true);
  };

  const openEdit = (pkg: PackageRow) => {
    setEditPkg(pkg);
    setEditItems(pkg.items);
    setModalOpen(true);
  };

  const activeMenu = menuItems.filter((m) => m.active);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {packages.filter((p) => p.active).length} paket aktif — tampil di <strong>POS → Paket</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapPackagesAction}>
            <input type="hidden" name="outletId" value={outletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset template
            </button>
          </form>
          <button type="button" onClick={openNew} className="btn-primary px-3 py-2 text-sm">
            <Plus className="h-4 w-4" aria-hidden />
            Paket
          </button>
        </div>
      </div>

      {packages.length === 0 ? (
        <div className="panel p-8 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
          <p className="font-bold text-navy-900">Belum ada paket menu</p>
          <p className="mt-1 text-sm text-slate-500">Bundling beberapa item jadi satu harga — seperti Menu Package ESB.</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-slate-100">
          {packages.map((pkg) => (
            <li key={pkg.id} className={`px-4 py-4 ${!pkg.active ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-navy-900">{pkg.name}</p>
                  <p className="text-sm text-gold-700">{formatRp(pkg.bundlePrice)}</p>
                  <p className="mt-1 text-xs text-slate-500">{pkg.summary}</p>
                  {pkg.description && <p className="mt-1 text-xs text-slate-400">{pkg.description}</p>}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openEdit(pkg)} className="btn-secondary px-2 py-1.5 text-xs">
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <form action={toggleMenuPackageAction}>
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="id" value={pkg.id} />
                    <input type="hidden" name="active" value={pkg.active ? "0" : "1"} />
                    <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                      {pkg.active ? "Off" : "On"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editPkg ? "Edit Paket" : "Tambah Paket"}>
        <form action={saveMenuPackageAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editPkg && <input type="hidden" name="id" value={editPkg.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Nama paket
            <input
              name="name"
              required
              defaultValue={editPkg?.name ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Harga bundling (Rp)
            <input
              name="bundlePrice"
              type="number"
              min={0}
              required
              defaultValue={editPkg?.bundlePrice ?? 0}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Deskripsi
            <input
              name="description"
              defaultValue={editPkg?.description ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <fieldset>
            <legend className="mb-2 text-sm font-bold text-slate-700">Komponen paket</legend>
            {[0, 1, 2, 3].map((i) => {
              const row = editItems[i];
              return (
                <div key={i} className="mb-2 grid grid-cols-[1fr_80px] gap-2">
                  <select
                    name="menuItemId"
                    defaultValue={row?.menuItemId ?? ""}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <option value="">— pilih item —</option>
                    {activeMenu.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <input
                    name="itemQty"
                    type="number"
                    min={1}
                    defaultValue={row?.qty ?? 1}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    placeholder="Qty"
                  />
                </div>
              );
            })}
          </fieldset>
          <label className="block text-sm font-bold text-slate-700">
            Urutan
            <input
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={editPkg?.sortOrder ?? packages.length + 1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <button type="submit" className="btn-primary py-3">
            Simpan Paket
          </button>
        </form>
      </Modal>
    </>
  );
}
