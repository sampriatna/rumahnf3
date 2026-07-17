import { store, nextId, persistStore } from "./store";
import { seedKdsStations, isPosOutlet } from "./pos-seed";

export type KdsStation = {
  id: string;
  outletId: string;
  name: string;
  sortOrder: number;
  active: boolean;
};

export type StationSaveError = "duplicate" | "invalid" | "not-found" | "in-use";

function slugify(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
}

export function ensureStationsReady(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  const has = store().kdsStations.some((s) => s.outletId === outletId);
  if (!has) bootstrapStationsFromSeed(outletId);
}

export function bootstrapStationsFromSeed(outletId?: string) {
  const seeded = seedKdsStations();

  const toAdd = outletId ? seeded.filter((s) => s.outletId === outletId) : seeded;
  const s = store();
  for (const row of toAdd) {
    const existing = s.kdsStations.find((x) => x.id === row.id && x.outletId === row.outletId);
    if (!existing) {
      s.kdsStations.push({
        id: row.id,
        outletId: row.outletId,
        name: row.name,
        sortOrder: row.sortOrder,
        active: true
      });
    }
  }
  s.kdsSeeded = true;
  persistStore();
}

export function resetStationsFromSeed(outletId: string) {
  store().kdsStations = store().kdsStations.filter((s) => s.outletId !== outletId);
  bootstrapStationsFromSeed(outletId);
}

export function listStations(outletId: string, includeInactive = false): KdsStation[] {
  ensureStationsReady(outletId);
  return store()
    .kdsStations.filter((s) => s.outletId === outletId && (includeInactive || s.active))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function getStation(outletId: string, id: string) {
  return store().kdsStations.find((s) => s.outletId === outletId && s.id === id);
}

export function stationDisplayName(outletId: string, id: string): string {
  return getStation(outletId, id)?.name ?? id;
}

export function upsertStation(input: {
  outletId: string;
  id?: string;
  slug?: string;
  name: string;
  sortOrder?: number;
  active?: boolean;
}):
  | { ok: true; station: KdsStation }
  | { ok: false; error: StationSaveError } {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "invalid" };

  const slug = slugify(input.slug ?? input.id ?? name);
  if (!slug) return { ok: false, error: "invalid" };

  const s = store();
  const existingId = input.id ?? slug;
  const existing = s.kdsStations.find((x) => x.id === existingId && x.outletId === input.outletId);

  if (!input.id && s.kdsStations.some((x) => x.id === slug && x.outletId === input.outletId)) {
    return { ok: false, error: "duplicate" };
  }
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const station: KdsStation = {
    id: existing?.id ?? slug,
    outletId: input.outletId,
    name,
    sortOrder:
      input.sortOrder ??
      existing?.sortOrder ??
      s.kdsStations.filter((x) => x.outletId === input.outletId).length + 1,
    active: input.active ?? existing?.active ?? true
  };

  if (existing) Object.assign(existing, station);
  else s.kdsStations.push(station);

  s.kdsSeeded = true;
  persistStore();
  return { ok: true, station };
}

export function toggleStationActive(outletId: string, id: string, active: boolean) {
  const st = getStation(outletId, id);
  if (!st) return { ok: false as const, error: "not-found" as const };
  st.active = active;
  persistStore();
  return { ok: true as const, station: st };
}
