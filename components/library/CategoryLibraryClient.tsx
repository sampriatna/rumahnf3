"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import type { MenuCategory } from "@/lib/pos-kds-roadmap";
import { Modal } from "@/components/ui/Modal";
import { saveMenuCategoryAction, toggleMenuCategoryAction } from "@/app/library/actions";

export function CategoryLibraryClient({
  outletId,
  categories
}: {
  outletId: string;
  categories: MenuCategory[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<MenuCategory | null>(null);

  const openCreate = () => {
    setEditCat(null);
    setModalOpen(true);
  };

  const openEdit = (cat: MenuCategory) => {
    setEditCat(cat);
    setModalOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
          <Plus className="h-4 w-4" aria-hidden />
          Tambah Kategori
        </button>
      </div>

      <div className="grid gap-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={`panel flex items-center justify-between gap-3 p-4 ${!cat.active ? "opacity-60" : ""}`}
          >
            <div>
              <p className="font-bold text-navy-900">{cat.name}</p>
              <p className="text-xs text-slate-500">
                Urutan {cat.sortOrder}
                {!cat.active && " · Nonaktif"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(cat)}
                className="btn-secondary px-3 py-2 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </button>
              <form action={toggleMenuCategoryAction}>
                <input type="hidden" name="outletId" value={outletId} />
                <input type="hidden" name="id" value={cat.id} />
                <input type="hidden" name="active" value={cat.active ? "0" : "1"} />
                <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                  {cat.active ? "Nonaktifkan" : "Aktifkan"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editCat ? "Edit Kategori" : "Tambah Kategori"}
      >
        <form action={saveMenuCategoryAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editCat && <input type="hidden" name="id" value={editCat.id} />}
          <input type="hidden" name="active" value={editCat?.active !== false ? "1" : "0"} />

          <div>
            <label className="text-xs font-bold text-slate-500">Nama Kategori *</label>
            <input
              name="name"
              required
              defaultValue={editCat?.name ?? ""}
              placeholder="Contoh: Kopi, Makanan"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Urutan Tampil</label>
            <input
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={editCat?.sortOrder ?? categories.length + 1}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
          </div>

          <div className="flex gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary flex-1 py-3">
              Batal
            </button>
            <button type="submit" className="btn-primary flex-1 py-3">
              Simpan
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
