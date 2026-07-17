import type { StaffCapability } from "./types";
import type { SessionPayload } from "./session";

const ALL: StaffCapability[] = ["pos", "kds", "inventory", "forms"];

/** Akun pribadi staf = form/SOP saja. POS/KDS/inventory hanya bila capability di-set (tablet/stasiun). */
export function effectiveCapabilities(session: SessionPayload): StaffCapability[] {
  if (session.role === "owner" || session.role === "admin" || session.role === "leader") {
    return ALL;
  }
  const caps = (session as SessionPayload & { capabilities?: StaffCapability[] }).capabilities;
  return caps?.length ? caps : ["forms"];
}

export function canAccessCapability(
  session: SessionPayload | null,
  cap: StaffCapability
): boolean {
  if (!session) return false;
  return effectiveCapabilities(session).includes(cap);
}

export function posAccessDeniedRedirect() {
  return `/pos/login?error=${encodeURIComponent("no-pos")}`;
}

export function kdsAccessDeniedRedirect() {
  return `/login?error=1&mode=kds-denied`;
}
