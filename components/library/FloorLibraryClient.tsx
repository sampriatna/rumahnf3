"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, LayoutGrid } from "lucide-react";
import type { FloorTable, TableSection } from "@/lib/floor-service";
import { Modal } from "@/components/ui/Modal";
import {
  saveTableSectionAction,
  toggleTableSectionAction,
  saveFloorTableAction,
  toggleFloorTableAction,
  bootstrapFloorAction
} from "@/app/library/floor-actions";

export function FloorLibraryClient({
  outletId,
  sections,
  tables
}: {
  outletId: string;
  sections: TableSection[];
  tables: FloorTable[];
}) {
  const [sectionModal, setSectionModal] = useState(false);
  const [tableModal, setTableModal] = useState(false);
  const [editSection, setEditSection] = useState<TableSection | null>(null);
  const [editTable, setEditTable] = useState<FloorTable | null>(null);

  const tablesBySection = useMemo(() => {
    const map = new Map<string, FloorTable[]>();
    for (const t of tables) {
      const list = map.get(t.sectionId) ?? [];
      list.push(t);
      map.set(t.sectionId, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "id", { numeric: true }));
    }
    return map;
  }, [tables]);

  const activeSections = sections.filter((s) => s.active);
  const totalActiveTables = tables.filter((t) => t.active).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {activeSections.length} area · {totalActiveTables} meja aktif — dipakai di{" "}
          <strong>POS → Denah Meja</strong>
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapFloorAction}>
            <input type="hidden" name="outletId" value={outletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset dari template
            </button>
          </form>
          <button type="button" onClick={() => { setEditSection(null); setSectionModal(true); }} className="btn-secondary px-3 py-2 text-sm">
            <Plus className="h-4 w-4" aria-hidden />
            Area
          </button>
          <button
            type="button"
            onClick={() => { setEditTable(null); setTableModal(true); }}
            className="btn-primary px-3 py-2 text-sm"
            disabled={sections.length === 0}
          >
            <Plus className="h-4 w-4" aria-hidden />
            Meja
          </button>
        </div>
      </div>

      {sections.length === 0 ? (
        <div className="panel p-8 text-center">
          <LayoutGrid className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
          <p className="font-bold text-navy-900">Belum ada area meja</p>
          <p className="mt-1 text-sm text-slate-500">Tambah area (Indoor, Teras, VIP) lalu daftarkan nomor meja.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((sec) => {
            const secTables = tablesBySection.get(sec.id) ?? [];
            return (
              <section key={sec.id} className={`panel overflow-hidden ${!sec.active ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
                  <div>
                    <h2 className="font-black text-navy-900">{sec.name}</h2>
                    <p className="text-xs text-slate-500">
                      Urutan {sec.sortOrder} · {secTables.filter((t) => t.active).length} meja
                      {!sec.active && " · Nonaktif"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditSection(sec); setSectionModal(true); }}
                      className="btn-secondary px-3 py-1.5 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                      Edit
                    </button>
                    <form action={toggleTableSectionAction}>
                      <input type="hidden" name="outletId" value={outletId} />
                      <input type="hidden" name="id" value={sec.id} />
                      <input type="hidden" name="active" value={sec.active ? "0" : "1"} />
                      <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
                        {sec.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                    </form>
                  </div>
                </div>

                {secTables.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-slate-500">Belum ada meja di area ini.</p>
                ) : (
                  <div className="grid gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {secTables.map((table) => (
                      <div
                        key={table.id}
                        className={`flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-3 ${!table.active ? "opacity-50" : ""}`}
                      >
                        <div>
                          <p className="text-lg font-black text-navy-900">Meja {table.label}</p>
                          <p className="text-xs text-slate-500">{table.seats} kursi</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => { setEditTable(table); setTableModal(true); }}
                            className="btn-secondary px-2 py-1.5 text-xs"
                          >
                            Edit
                          </button>
                          <form action={toggleFloorTableAction}>
                            <input type="hidden" name="outletId" value={outletId} />
                            <input type="hidden" name="id" value={table.id} />
                            <input type="hidden" name="active" value={table.active ? "0" : "1"} />
                            <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                              {table.active ? "Off" : "On"}
                            </button>
                          </form>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Modal
        open={sectionModal}
        onClose={() => setSectionModal(false)}
        title={editSection ? "Edit Area Meja" : "Tambah Area Meja"}
      >
        <form action={saveTableSectionAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editSection && <input type="hidden" name="id" value={editSection.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Nama area
            <input
              name="name"
              required
              defaultValue={editSection?.name ?? ""}
              placeholder="Indoor, Teras, VIP..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Urutan tampil
            <input
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={editSection?.sortOrder ?? sections.length + 1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <button type="submit" className="btn-primary py-3">
            Simpan Area
          </button>
        </form>
      </Modal>

      <Modal
        open={tableModal}
        onClose={() => setTableModal(false)}
        title={editTable ? `Edit Meja ${editTable.label}` : "Tambah Meja"}
      >
        <form action={saveFloorTableAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editTable && <input type="hidden" name="id" value={editTable.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Area
            <select
              name="sectionId"
              required
              defaultValue={editTable?.sectionId ?? sections.find((s) => s.active)?.id ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {sections.filter((s) => s.active).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Nomor / label meja
            <input
              name="label"
              required
              defaultValue={editTable?.label ?? ""}
              placeholder="1, A1, VIP-3..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Kapasitas (kursi)
            <input
              name="seats"
              type="number"
              min={1}
              required
              defaultValue={editTable?.seats ?? 4}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Urutan
            <input
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={editTable?.sortOrder ?? 1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <button type="submit" className="btn-primary py-3">
            Simpan Meja
          </button>
        </form>
      </Modal>
    </>
  );
}
