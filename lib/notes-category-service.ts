import { store, nextId, persistStore } from "./store";
import { isPosOutlet } from "./pos-seed";
import { NOTES_CATEGORY_SEED } from "./notes-category-seed";

export type NotesCategory = {
  id: string;
  outletId: string;
  name: string;
  group?: string;
  sortOrder: number;
  active: boolean;
};

export type NotesSaveError = "duplicate" | "invalid" | "not-found";

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function ensureNotesReady(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  const has = store().notesCategories.some((n) => n.outletId === outletId);
  if (!has) bootstrapNotesFromSeed(outletId);
}

export function bootstrapNotesFromSeed(outletId?: string) {
  const rows = outletId
    ? NOTES_CATEGORY_SEED.filter((r) => r.outletId === outletId)
    : NOTES_CATEGORY_SEED;

  rows.forEach((row, i) => {
    upsertNotesCategory({
      outletId: row.outletId,
      name: row.name,
      group: row.group,
      sortOrder: i + 1,
      active: true
    });
  });
  persistStore();
}

export function resetNotesFromSeed(outletId: string) {
  store().notesCategories = store().notesCategories.filter((n) => n.outletId !== outletId);
  bootstrapNotesFromSeed(outletId);
}

export function listNotesCategories(outletId: string, includeInactive = false): NotesCategory[] {
  ensureNotesReady(outletId);
  return store()
    .notesCategories.filter((n) => n.outletId === outletId && (includeInactive || n.active))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function upsertNotesCategory(input: {
  id?: string;
  outletId: string;
  name: string;
  group?: string;
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; category: NotesCategory }
  | { ok: false; error: NotesSaveError } {
  const name = normalizeName(input.name);
  if (!name) return { ok: false, error: "invalid" };

  const s = store();
  const dup = s.notesCategories.find(
    (x) =>
      x.outletId === input.outletId &&
      x.id !== input.id &&
      x.name.toLowerCase() === name.toLowerCase()
  );
  if (dup) return { ok: false, error: "duplicate" };

  const existing = input.id ? s.notesCategories.find((x) => x.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const category: NotesCategory = {
    id: existing?.id ?? nextId("nc"),
    outletId: input.outletId,
    name,
    group: input.group?.trim() || undefined,
    sortOrder:
      input.sortOrder ??
      existing?.sortOrder ??
      s.notesCategories.filter((x) => x.outletId === input.outletId).length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) Object.assign(existing, category);
  else s.notesCategories.push(category);

  persistStore();
  return { ok: true, category };
}

export function toggleNotesCategoryActive(id: string, active: boolean) {
  const cat = store().notesCategories.find((n) => n.id === id);
  if (!cat) return { ok: false as const, error: "not-found" as const };
  cat.active = active;
  persistStore();
  return { ok: true as const, category: cat };
}

/** Gabungkan catatan terpilih + teks bebas untuk order line. */
export function formatKitchenNote(selected: string[], freeText?: string) {
  const parts = [...selected.map((s) => s.trim()).filter(Boolean)];
  const free = freeText?.trim();
  if (free) parts.push(free);
  return parts.length ? parts.join(" · ") : undefined;
}
