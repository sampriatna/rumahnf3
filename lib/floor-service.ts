import { store, nextId, persistStore } from "./store";
import { FLOOR_SEED } from "./floor-seed";
import { isPosOutlet } from "./pos-seed";

export type TableSection = {
  id: string;
  outletId: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type FloorTable = {
  id: string;
  outletId: string;
  sectionId: string;
  label: string;
  seats: number;
  sortOrder: number;
  active: boolean;
};

export type FloorSaveError = "duplicate" | "invalid" | "not-found" | "section-in-use";

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

function normalizeLabel(label: string) {
  return label.trim();
}

export function ensureFloorReady(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  const s = store();
  const has = s.floorTables.some((t) => t.outletId === outletId);
  if (!has) bootstrapFloorFromSeed(outletId);
}

export function resetFloorFromSeed(outletId: string) {
  const s = store();
  s.tableSections = s.tableSections.filter((x) => x.outletId !== outletId);
  s.floorTables = s.floorTables.filter((x) => x.outletId !== outletId);
  bootstrapFloorFromSeed(outletId);
}

export function bootstrapFloorFromSeed(outletId: string) {
  const rows = FLOOR_SEED.filter((r) => r.outletId === outletId);
  if (!rows.length) return;

  const sectionOrder = new Map<string, number>();
  for (const row of rows) {
    if (!sectionOrder.has(row.section)) {
      sectionOrder.set(row.section, sectionOrder.size + 1);
      upsertTableSection({
        outletId,
        name: row.section,
        sortOrder: sectionOrder.get(row.section)!,
        active: true
      });
    }
  }

  // Jangan panggil listTableSections di sini — itu memanggil ensureFloorReady lagi
  // sementara floorTables masih kosong → infinite recursion.
  const sections = store()
    .tableSections.filter((sec) => sec.outletId === outletId)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
  const byName = new Map(sections.map((sec) => [sec.name.toLowerCase(), sec]));

  rows.forEach((row, i) => {
    const sec = byName.get(row.section.toLowerCase());
    if (!sec) return;
    upsertFloorTable({
      outletId,
      sectionId: sec.id,
      label: row.label,
      seats: row.seats,
      sortOrder: i + 1,
      active: true
    });
  });

  store().floorSeeded = true;
  persistStore();
}

export function listTableSections(outletId: string, includeInactive = false): TableSection[] {
  ensureFloorReady(outletId);
  return store()
    .tableSections.filter((s) => s.outletId === outletId && (includeInactive || s.active))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function listFloorTables(outletId: string, includeInactive = false): FloorTable[] {
  ensureFloorReady(outletId);
  return store()
    .floorTables.filter((t) => t.outletId === outletId && (includeInactive || t.active))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label, "id", { numeric: true }));
}

export function getTableSection(id: string) {
  return store().tableSections.find((s) => s.id === id);
}

export function getFloorTable(id: string) {
  return store().floorTables.find((t) => t.id === id);
}

export function sectionName(sectionId: string): string {
  return getTableSection(sectionId)?.name ?? "Area";
}

export function upsertTableSection(input: {
  id?: string;
  outletId: string;
  name: string;
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; section: TableSection }
  | { ok: false; error: FloorSaveError } {
  const name = normalizeName(input.name);
  if (!name) return { ok: false, error: "invalid" };

  const s = store();
  const dup = s.tableSections.find(
    (x) =>
      x.outletId === input.outletId &&
      x.id !== input.id &&
      x.name.toLowerCase() === name.toLowerCase()
  );
  if (dup) return { ok: false, error: "duplicate" };

  const existing = input.id ? s.tableSections.find((x) => x.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const section: TableSection = {
    id: existing?.id ?? nextId("ts"),
    outletId: input.outletId,
    name,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? s.tableSections.filter((x) => x.outletId === input.outletId).length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) {
    Object.assign(existing, section);
  } else {
    s.tableSections.push(section);
  }

  persistStore();
  return { ok: true, section };
}

export function toggleTableSectionActive(id: string, active: boolean) {
  const sec = getTableSection(id);
  if (!sec) return { ok: false as const, error: "not-found" as const };
  sec.active = active;
  persistStore();
  return { ok: true as const, section: sec };
}

export function upsertFloorTable(input: {
  id?: string;
  outletId: string;
  sectionId: string;
  label: string;
  seats: number;
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; table: FloorTable }
  | { ok: false; error: FloorSaveError } {
  const label = normalizeLabel(input.label);
  if (!label || input.seats < 1 || !getTableSection(input.sectionId)) {
    return { ok: false, error: "invalid" };
  }

  const s = store();
  const dup = s.floorTables.find(
    (x) =>
      x.outletId === input.outletId &&
      x.id !== input.id &&
      x.label.toLowerCase() === label.toLowerCase()
  );
  if (dup) return { ok: false, error: "duplicate" };

  const existing = input.id ? s.floorTables.find((x) => x.id === input.id) : undefined;
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const table: FloorTable = {
    id: existing?.id ?? nextId("ft"),
    outletId: input.outletId,
    sectionId: input.sectionId,
    label,
    seats: Math.floor(input.seats),
    sortOrder:
      input.sortOrder ??
      existing?.sortOrder ??
      s.floorTables.filter((x) => x.outletId === input.outletId && x.sectionId === input.sectionId).length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) {
    Object.assign(existing, table);
  } else {
    s.floorTables.push(table);
  }

  persistStore();
  return { ok: true, table };
}

export function toggleFloorTableActive(id: string, active: boolean) {
  const table = getFloorTable(id);
  if (!table) return { ok: false as const, error: "not-found" as const };
  table.active = active;
  persistStore();
  return { ok: true as const, table };
}

export function deleteTableSection(id: string) {
  const sec = getTableSection(id);
  if (!sec) return { ok: false as const, error: "not-found" as const };
  const inUse = store().floorTables.some((t) => t.sectionId === id);
  if (inUse) return { ok: false as const, error: "section-in-use" as const };
  store().tableSections = store().tableSections.filter((s) => s.id !== id);
  persistStore();
  return { ok: true as const };
}
