"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import type { MenuModifier } from "@/lib/pos-kds-roadmap";
import { formatRp } from "@/lib/finance";
import { Modal } from "@/components/ui/Modal";
import { saveModifierAction, toggleModifierAction } from "@/app/library/actions";

export function ModifierLibraryClient({
  outletId,
  modifiers
}: {
  outletId: string;
  modifiers: MenuModifier[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [edit, setEdit] = useState<MenuModifier | null>(null);

  const openCreate = () => {
    setEdit(null);
    setModalOpen(true);
  };

  const openEdit = (m: MenuModifier) => {
    setEdit(m);
    setModalOpen(true);
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={openCreate} className="btn-primary px-4 py-2 text-sm">
          <Plus className="h-4 w-4" aria-hidden />
          Tambah Add-on
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {modifiers.map((m) => (
          <div
            key={m.id}
            className={`panel flex items-center justify-between gap-3 p-4 ${!m.active ? "opacity-60" : ""}`}
          >
            <div>
              <p className="font-bold text-navy-900">{m.name}</p>
              <p className="text-sm text-gold-700">
                {m.priceDelta > 0 ? `+${formatRp(m.priceDelta)}` : "Gratis"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(m)}
                className="btn-secondary px-3 py-2 text-xs"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden />
                Edit
              </button>
              <form action={toggleModifierAction}>
                <input type="hidden" name="outletId" value={outletId} />
                <input type="hidden" name="id" value={m.id} />
                <input type="hidden" name="active" value={m.active ? "0" : "1"} />
                <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                  {m.active ? "Nonaktif" : "Aktifkan"}
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {modifiers.length === 0 && (
        <p className="panel p-8 text-center text-sm text-slate-500">
          Belum ada add-on. Contoh: Extra Shot, Ice, Kurang Manis.
        </p>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={edit ? "Edit Add-on" : "Tambah Add-on"}
      >
        <form action={saveModifierAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {edit && <input type="hidden" name="id" value={edit.id} />}
          <input type="hidden" name="active" value={edit?.active !== false ? "1" : "0"} />

          <div>
            <label className="text-xs font-bold text-slate-500">Nama Add-on *</label>
            <input
              name="name"
              required
              defaultValue={edit?.name ?? ""}
              placeholder="Contoh: Extra Shot, Ice"
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500">Tambahan Harga (Rp)</label>
            <input
              name="priceDelta"
              type="number"
              min={0}
              step={500}
              defaultValue={edit?.priceDelta ?? 0}
              className="mt-1 block w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm"
            />
            <p className="mt-1 text-[11px] text-slate-400">0 = gratis (mis. pilih Hot/Ice)</p>
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
