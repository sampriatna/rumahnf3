"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Monitor, StickyNote } from "lucide-react";
import type { KdsStation } from "@/lib/station-service";
import type { NotesCategory } from "@/lib/notes-category-service";
import { Modal } from "@/components/ui/Modal";
import {
  saveStationAction,
  toggleStationAction,
  bootstrapStationsAction,
  saveNotesCategoryAction,
  toggleNotesCategoryAction,
  bootstrapNotesAction
} from "@/app/library/kds-actions";

export function KdsLibraryClient({
  outletId,
  stations,
  notes
}: {
  outletId: string;
  stations: KdsStation[];
  notes: NotesCategory[];
}) {
  const [stationModal, setStationModal] = useState(false);
  const [noteModal, setNoteModal] = useState(false);
  const [editStation, setEditStation] = useState<KdsStation | null>(null);
  const [editNote, setEditNote] = useState<NotesCategory | null>(null);

  const notesByGroup = useMemo(() => {
    const map = new Map<string, NotesCategory[]>();
    for (const n of notes) {
      const g = n.group ?? "Lainnya";
      const list = map.get(g) ?? [];
      list.push(n);
      map.set(g, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
    }
    return map;
  }, [notes]);

  const activeStations = stations.filter((s) => s.active).length;
  const activeNotes = notes.filter((n) => n.active).length;

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5 text-navy-700" aria-hidden />
              <div>
                <h2 className="font-black text-navy-900">Station KDS</h2>
                <p className="text-xs text-slate-500">
                  {activeStations} aktif — dipakai di KDS & routing produk
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={bootstrapStationsAction}>
                <input type="hidden" name="outletId" value={outletId} />
                <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                  Reset template
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setEditStation(null); setStationModal(true); }}
                className="btn-primary px-3 py-2 text-sm"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Station
              </button>
            </div>
          </div>

          {stations.length === 0 ? (
            <div className="panel p-6 text-center text-sm text-slate-500">Belum ada station.</div>
          ) : (
            <ul className="panel divide-y divide-slate-100">
              {stations.map((st) => (
                <li
                  key={st.id}
                  className={`flex items-center justify-between gap-3 px-4 py-3 ${!st.active ? "opacity-50" : ""}`}
                >
                  <div>
                    <p className="font-bold text-navy-900">{st.name}</p>
                    <p className="text-xs text-slate-500">
                      ID <code className="rounded bg-slate-100 px-1">{st.id}</code> · urutan {st.sortOrder}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setEditStation(st); setStationModal(true); }}
                      className="btn-secondary px-2 py-1.5 text-xs"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <form action={toggleStationAction}>
                      <input type="hidden" name="outletId" value={outletId} />
                      <input type="hidden" name="id" value={st.id} />
                      <input type="hidden" name="active" value={st.active ? "0" : "1"} />
                      <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                        {st.active ? "Off" : "On"}
                      </button>
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-navy-700" aria-hidden />
              <div>
                <h2 className="font-black text-navy-900">Notes Category</h2>
                <p className="text-xs text-slate-500">
                  {activeNotes} aktif — dipilih kasir saat tambah item
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <form action={bootstrapNotesAction}>
                <input type="hidden" name="outletId" value={outletId} />
                <button type="submit" className="btn-secondary px-3 py-2 text-xs">
                  Reset template
                </button>
              </form>
              <button
                type="button"
                onClick={() => { setEditNote(null); setNoteModal(true); }}
                className="btn-primary px-3 py-2 text-sm"
              >
                <Plus className="h-4 w-4" aria-hidden />
                Catatan
              </button>
            </div>
          </div>

          {notes.length === 0 ? (
            <div className="panel p-6 text-center text-sm text-slate-500">Belum ada kategori catatan.</div>
          ) : (
            <div className="space-y-4">
              {[...notesByGroup.entries()].map(([group, cats]) => (
                <div key={group} className="panel overflow-hidden">
                  <p className="border-b border-slate-100 bg-slate-50/80 px-4 py-2 text-xs font-bold uppercase text-slate-500">
                    {group}
                  </p>
                  <ul className="divide-y divide-slate-100">
                    {cats.map((cat) => (
                      <li
                        key={cat.id}
                        className={`flex items-center justify-between gap-3 px-4 py-2.5 ${!cat.active ? "opacity-50" : ""}`}
                      >
                        <span className="text-sm font-semibold text-navy-900">{cat.name}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setEditNote(cat); setNoteModal(true); }}
                            className="btn-secondary px-2 py-1.5 text-xs"
                          >
                            Edit
                          </button>
                          <form action={toggleNotesCategoryAction}>
                            <input type="hidden" name="outletId" value={outletId} />
                            <input type="hidden" name="id" value={cat.id} />
                            <input type="hidden" name="active" value={cat.active ? "0" : "1"} />
                            <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                              {cat.active ? "Off" : "On"}
                            </button>
                          </form>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <Modal
        open={stationModal}
        onClose={() => setStationModal(false)}
        title={editStation ? "Edit Station KDS" : "Tambah Station KDS"}
      >
        <form action={saveStationAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editStation && <input type="hidden" name="id" value={editStation.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Nama station
            <input
              name="name"
              required
              defaultValue={editStation?.name ?? ""}
              placeholder="Dapur, Bar, Packing..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          {!editStation && (
            <label className="block text-sm font-bold text-slate-700">
              Slug ID (opsional)
              <input
                name="slug"
                placeholder="dapur, bar, packing..."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
              />
            </label>
          )}
          <label className="block text-sm font-bold text-slate-700">
            Urutan tampil
            <input
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={editStation?.sortOrder ?? stations.length + 1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <button type="submit" className="btn-primary py-3">
            Simpan Station
          </button>
        </form>
      </Modal>

      <Modal
        open={noteModal}
        onClose={() => setNoteModal(false)}
        title={editNote ? "Edit Catatan Dapur" : "Tambah Catatan Dapur"}
      >
        <form action={saveNotesCategoryAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editNote && <input type="hidden" name="id" value={editNote.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Teks catatan
            <input
              name="name"
              required
              defaultValue={editNote?.name ?? ""}
              placeholder="Tanpa Bawang, Gula Dipisah..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Grup
            <input
              name="group"
              defaultValue={editNote?.group ?? ""}
              placeholder="Alergi, Minuman, Porsi..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Urutan tampil
            <input
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={editNote?.sortOrder ?? notes.length + 1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <button type="submit" className="btn-primary py-3">
            Simpan Catatan
          </button>
        </form>
      </Modal>
    </>
  );
}
