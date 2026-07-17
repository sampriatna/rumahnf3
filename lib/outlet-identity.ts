import { OUTLETS, type MockOutlet } from "./mock-data";

export const WAREHOUSE_LOCATION_CODE = "GDG";

type OutletRegistryRow = MockOutlet & {
  uuid?: string;
};

const REGISTRY: OutletRegistryRow[] = OUTLETS;

function norm(v?: string | null) {
  return (v ?? "").trim().toLowerCase();
}

function normCode(v?: string | null) {
  return (v ?? "").trim().toUpperCase();
}

export type OutletIdentity = {
  uuid?: string;
  slug: string;
  code: string;
  name: string;
  groupId: string;
};

export function listOutletRegistry(): OutletIdentity[] {
  return REGISTRY.map((o) => ({
    uuid: o.uuid,
    slug: o.id,
    code: o.code,
    name: o.name,
    groupId: o.groupId
  }));
}

export function resolveOutletIdentity(input?: string | null): OutletIdentity | null {
  if (!input) return null;
  const asSlug = norm(input);
  const asCode = normCode(input);

  const match =
    REGISTRY.find((o) => norm(o.id) === asSlug) ??
    REGISTRY.find((o) => normCode(o.code) === asCode) ??
    REGISTRY.find((o) => o.uuid && norm(o.uuid) === asSlug);

  if (!match) return null;
  return {
    uuid: match.uuid,
    slug: match.id,
    code: match.code,
    name: match.name,
    groupId: match.groupId
  };
}

export function toOutletSlug(input?: string | null): string | undefined {
  const resolved = resolveOutletIdentity(input);
  if (resolved) return resolved.slug;
  return input ? norm(input) : undefined;
}

export function toOutletCode(input?: string | null): string {
  const resolved = resolveOutletIdentity(input);
  if (resolved) return resolved.code;
  if (!input) return WAREHOUSE_LOCATION_CODE;
  return normCode(input);
}

export function outletDisplayName(input?: string | null): string {
  if (!input) return "—";
  const resolved = resolveOutletIdentity(input);
  return resolved?.name ?? input;
}

/** Lookup outlet record via canonical resolver (slug/code/uuid). */
export function getOutletByIdentity(input?: string | null): MockOutlet | null {
  const identity = resolveOutletIdentity(input);
  if (!identity) return null;
  return REGISTRY.find((o) => o.id === identity.slug) ?? null;
}
