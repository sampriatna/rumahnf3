import type { SessionPayload } from "./session";
import { readShellOutletCookie } from "./shell-outlet";
import { toOutletSlug } from "./outlet-identity";
import { isPosOutlet } from "./pos-seed";

/**
 * Outlet aktif untuk halaman portal (owner/admin: URL param → shell cookie → session).
 * Leader selalu terikat session.outletId.
 */
export function resolvePortalOutletScope(
  session: Pick<SessionPayload, "role" | "outletId">,
  explicitOutlet?: string | null
): string | undefined {
  if (session.role === "leader") {
    return session.outletId ? toOutletSlug(session.outletId) : undefined;
  }

  if (explicitOutlet) {
    const slug = toOutletSlug(explicitOutlet);
    return slug && isPosOutlet(slug) ? slug : slug;
  }

  if (session.role === "owner" || session.role === "admin") {
    const cookie = readShellOutletCookie();
    if (cookie && cookie !== "all") {
      const slug = toOutletSlug(cookie);
      if (slug && isPosOutlet(slug)) return slug;
    }
  }

  return session.outletId ? toOutletSlug(session.outletId) : undefined;
}

/** Apakah owner/admin memilih "Semua Outlet" di shell switcher. */
export function isPortalAllOutletsScope(
  session: Pick<SessionPayload, "role">,
  explicitOutlet?: string | null
): boolean {
  if (explicitOutlet) return false;
  if (session.role !== "owner" && session.role !== "admin") return false;
  const cookie = readShellOutletCookie();
  return !cookie || cookie === "all";
}

/** Outlet Library — shell cookie + URL param + fallback daftar F&B. */
export function resolveLibraryOutletId(
  session: Pick<SessionPayload, "role" | "outletId">,
  explicitOutlet?: string | null,
  candidates?: Array<{ id: string }>
): string | undefined {
  const scoped = resolvePortalOutletScope(session, explicitOutlet);
  if (scoped && isPosOutlet(scoped)) return scoped;
  return candidates?.[0]?.id;
}
