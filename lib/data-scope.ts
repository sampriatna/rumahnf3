import type { Role } from "./types";
import type { SessionPayload } from "./session";
import { WAREHOUSE_ID } from "./inventory";
import { toOutletSlug } from "./outlet-identity";

/** Owner, admin, atau super admin — akses lintas outlet. */
export function isGlobalRole(role: Role, isSuperAdmin?: boolean): boolean {
  return isSuperAdmin === true || role === "owner" || role === "admin";
}

/** Finance & payroll — hanya owner/admin. */
export function canAccessFinance(role: Role, isSuperAdmin?: boolean): boolean {
  return isGlobalRole(role, isSuperAdmin);
}

/** Cek apakah session boleh mengakses data outlet tertentu. */
export function canAccessOutlet(
  session: Pick<SessionPayload, "role" | "outletId" | "isSuperAdmin"> | null,
  outletId?: string | null
): boolean {
  if (!session) return false;
  if (isGlobalRole(session.role, session.isSuperAdmin)) return true;
  const target = toOutletSlug(outletId);
  if (!target) return true;
  return toOutletSlug(session.outletId) === target;
}

/** Lokasi stok yang boleh dilihat session (undefined = semua). */
export function inventoryLocationsForSession(
  session: Pick<SessionPayload, "role" | "outletId" | "isSuperAdmin"> | null
): string[] | undefined {
  if (!session) return [];
  if (isGlobalRole(session.role, session.isSuperAdmin)) return undefined;
  if (session.role === "leader" && session.outletId) {
    return [session.outletId, WAREHOUSE_ID];
  }
  if (session.outletId) return [session.outletId];
  return [];
}

export function locationVisibleToSession(
  session: Pick<SessionPayload, "role" | "outletId" | "isSuperAdmin"> | null,
  locationId: string
): boolean {
  const allowed = inventoryLocationsForSession(session);
  if (allowed === undefined) return true;
  return allowed.includes(locationId);
}

/** Filter array berdasarkan outlet_id kolom. */
export function filterByOutlet<T>(
  items: T[],
  session: Pick<SessionPayload, "role" | "outletId" | "isSuperAdmin"> | null,
  getOutletId: (item: T) => string | undefined | null
): T[] {
  if (!session || isGlobalRole(session.role, session.isSuperAdmin)) return items;
  return items.filter((item) => canAccessOutlet(session, getOutletId(item)));
}
