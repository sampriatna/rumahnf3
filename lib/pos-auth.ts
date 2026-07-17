import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";
import { canAccessCapability, effectiveCapabilities } from "./staff-capability";
import type { Role } from "./types";
import { isPosOutlet } from "./pos-seed";
import { configuredPosUrl } from "./subdomains";

export const POS_ROLES = ["staff", "leader", "admin", "owner"] as const;
export function posLoginUrl(next?: string) {
  const base = configuredPosUrl();
  if (next?.startsWith("/pos") && !next.startsWith("//")) {
    const path = `/pos/login?next=${encodeURIComponent(next)}`;
    return base ? `${base}${path}` : path;
  }
  const path = "/pos/login";
  return base ? `${base}${path}` : path;
}

/** Guard halaman POS — redirect ke login kasir, bukan Command Center. */
export function requirePosSession(): SessionPayload {
  const session = getSession();
  if (!session) redirect(posLoginUrl());
  if (!POS_ROLES.includes(session.role)) redirect(posLoginUrl() + "?error=forbidden");
  if (!canAccessCapability(session, "pos")) redirect(posLoginUrl() + "?error=no-pos");
  return session;
}

/** Landing setelah login kasir berhasil. */
export function posLandingPath(session: SessionPayload, next?: string | null) {
  if (next?.startsWith("/pos") && !next.startsWith("//")) return next;
  if (session.outletId && isPosOutlet(session.outletId)) {
    return `/pos?outlet=${session.outletId}`;
  }
  return "/pos";
}

export function isPosOnlyStaff(session: SessionPayload) {
  if (session.role !== "staff") return false;
  const caps = effectiveCapabilities(session);
  return caps.length === 1 && caps[0] === "pos";
}

export function canAccessPos(user: {
  role: string;
  capabilities?: import("./types").StaffCapability[];
}) {
  if (!POS_ROLES.includes(user.role as Role)) return false;
  if (user.role === "owner" || user.role === "admin" || user.role === "leader") return true;
  return user.capabilities?.includes("pos") ?? false;
}
