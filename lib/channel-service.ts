import { store, persistStore } from "./store";
import { isPosOutlet } from "./pos-seed";
import { CHANNEL_SEED } from "./channel-seed";
import type { PosOrderChannel } from "./pos-kds-roadmap";

export type SalesChannelKind =
  | "dine_in"
  | "takeaway"
  | "platform"
  | "delivery_own"
  | "wholesale"
  | "production"
  | "other";

export type SalesChannel = {
  /** Slug dipakai di order.channel (dine_in, gofood, …). */
  id: string;
  outletId: string;
  name: string;
  kind: SalesChannelKind;
  requiresTable: boolean;
  sortOrder: number;
  isDefault: boolean;
  active: boolean;
};

export type ChannelSaveError = "duplicate" | "invalid" | "not-found";

const PLATFORM_KINDS = new Set<SalesChannelKind>(["platform"]);

function slugify(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 24);
}

export function ensureChannelsReady(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  const has = store().salesChannels.some((c) => c.outletId === outletId);
  if (!has) bootstrapChannelsFromSeed(outletId);
  ensurePrimaryPosChannels(outletId);
}

/** Tambah channel kasir utama bila belum ada (idempotent, tidak ubah yang existing). */
export function ensurePrimaryPosChannels(outletId: string) {
  if (!isPosOutlet(outletId)) return;
  const primary: Array<{
    id: string;
    name: string;
    kind: SalesChannelKind;
    requiresTable?: boolean;
  }> = [
    { id: "dine_in", name: "Dine In", kind: "dine_in", requiresTable: true },
    { id: "takeaway", name: "Takeaway", kind: "takeaway" },
    { id: "delivery_own", name: "Pesan Antar", kind: "delivery_own" }
  ];
  for (const def of primary) {
    if (!getSalesChannel(outletId, def.id)) {
      upsertSalesChannel({
        outletId,
        slug: def.id,
        name: def.name,
        kind: def.kind,
        requiresTable: def.requiresTable,
        active: true
      });
    }
  }
}

export function bootstrapChannelsFromSeed(outletId?: string) {
  const rows = outletId ? CHANNEL_SEED.filter((r) => r.outletId === outletId) : CHANNEL_SEED;
  rows.forEach((row, i) => {
    upsertSalesChannel({
      outletId: row.outletId,
      id: row.id,
      name: row.name,
      kind: row.kind,
      requiresTable: row.requiresTable ?? false,
      isDefault: row.isDefault ?? false,
      sortOrder: i + 1,
      active: true
    });
  });
  persistStore();
}

export function resetChannelsFromSeed(outletId: string) {
  store().salesChannels = store().salesChannels.filter((c) => c.outletId !== outletId);
  bootstrapChannelsFromSeed(outletId);
}

export function listSalesChannels(outletId: string, includeInactive = false): SalesChannel[] {
  ensureChannelsReady(outletId);
  return store()
    .salesChannels.filter((c) => c.outletId === outletId && (includeInactive || c.active))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "id"));
}

export function getSalesChannel(outletId: string, id: string) {
  return store().salesChannels.find((c) => c.outletId === outletId && c.id === id);
}

export function getDefaultSalesChannel(outletId: string): SalesChannel | undefined {
  const active = listSalesChannels(outletId);
  return active.find((c) => c.isDefault) ?? active[0];
}

export function channelDisplayName(outletId: string, channelId: string): string {
  return getSalesChannel(outletId, channelId)?.name ?? channelId;
}

export function isPlatformChannel(outletId: string, channelId: string): boolean {
  const ch = getSalesChannel(outletId, channelId);
  return ch ? PLATFORM_KINDS.has(ch.kind) : ["gofood", "grab", "shopee"].includes(channelId);
}

export function isValidChannel(outletId: string, channelId: string): boolean {
  ensureChannelsReady(outletId);
  const ch = getSalesChannel(outletId, channelId);
  return Boolean(ch?.active);
}

export function resolveChannel(outletId: string, channelId?: string): PosOrderChannel {
  ensureChannelsReady(outletId);
  if (channelId && isValidChannel(outletId, channelId)) return channelId;
  return getDefaultSalesChannel(outletId)?.id ?? "dine_in";
}

export function upsertSalesChannel(input: {
  outletId: string;
  id?: string;
  slug?: string;
  name: string;
  kind: SalesChannelKind;
  requiresTable?: boolean;
  sortOrder?: number;
  isDefault?: boolean;
  active?: boolean;
}):
  | { ok: true; channel: SalesChannel }
  | { ok: false; error: ChannelSaveError } {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "invalid" };

  const slug = slugify(input.slug ?? input.id ?? name);
  if (!slug) return { ok: false, error: "invalid" };

  const s = store();
  const channelId = input.id ?? slug;
  const dupName = s.salesChannels.find(
    (c) =>
      c.outletId === input.outletId &&
      !(c.outletId === input.outletId && c.id === channelId) &&
      c.name.toLowerCase() === name.toLowerCase()
  );
  if (dupName) return { ok: false, error: "duplicate" };

  const existing = s.salesChannels.find((c) => c.outletId === input.outletId && c.id === channelId);
  if (input.id && !existing) return { ok: false, error: "not-found" };

  const channel: SalesChannel = {
    id: existing?.id ?? slug,
    outletId: input.outletId,
    name,
    kind: input.kind,
    requiresTable: input.requiresTable ?? existing?.requiresTable ?? false,
    sortOrder:
      input.sortOrder ??
      existing?.sortOrder ??
      s.salesChannels.filter((c) => c.outletId === input.outletId).length + 1,
    isDefault: input.isDefault ?? existing?.isDefault ?? false,
    active: input.active ?? existing?.active ?? true
  };

  if (channel.isDefault) {
    for (const c of s.salesChannels) {
      if (c.outletId === input.outletId) c.isDefault = false;
    }
  }

  if (existing) Object.assign(existing, channel);
  else s.salesChannels.push(channel);

  if (!s.salesChannels.some((c) => c.outletId === input.outletId && c.isDefault && c.active)) {
    const first = s.salesChannels.find((c) => c.outletId === input.outletId && c.active);
    if (first) first.isDefault = true;
  }

  persistStore();
  return { ok: true, channel };
}

export function toggleSalesChannelActive(outletId: string, id: string, active: boolean) {
  const ch = getSalesChannel(outletId, id);
  if (!ch) return { ok: false as const, error: "not-found" as const };
  ch.active = active;
  if (!active && ch.isDefault) {
    ch.isDefault = false;
    const next = store().salesChannels.find((c) => c.outletId === outletId && c.active && c.id !== id);
    if (next) next.isDefault = true;
  }
  persistStore();
  return { ok: true as const, channel: ch };
}

export function setDefaultSalesChannel(outletId: string, id: string) {
  const ch = getSalesChannel(outletId, id);
  if (!ch || !ch.active) return { ok: false as const, error: "not-found" as const };
  for (const c of store().salesChannels) {
    if (c.outletId === outletId) c.isDefault = c.id === id;
  }
  persistStore();
  return { ok: true as const, channel: ch };
}
