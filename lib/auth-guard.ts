import { redirect } from "next/navigation";
import { getSession, type SessionPayload } from "./session";
import { canAccessFinance, canAccessOutlet, isGlobalRole } from "./data-scope";
import type { Role } from "./types";
import type { StaffCapability } from "./types";
import { canAccessCapability } from "./staff-capability";

/** Wajib login — redirect ke /login bila belum ada session. */
export function requireSession(): SessionPayload {
  const session = getSession();
  if (!session) redirect("/login");
  return session;
}

/** Wajib salah satu role — redirect ke dashboard bila tidak cocok. */
export function requireRole(roles: Role[]): SessionPayload {
  const session = requireSession();
  if (!roles.includes(session.role)) redirect("/dashboard");
  return session;
}

/** Wajib akses finance (owner/admin). */
export function requireFinanceAccess(): SessionPayload {
  const session = requireSession();
  if (!canAccessFinance(session.role, session.isSuperAdmin)) redirect("/dashboard");
  return session;
}

/** Wajib akses outlet — redirect bila session tidak punya hak. */
export function requireOutletAccess(outletId?: string | null): SessionPayload {
  const session = requireSession();
  if (!canAccessOutlet(session, outletId)) redirect("/dashboard?error=outlet-denied");
  return session;
}

/** Wajib global role (owner/admin). */
export function requireGlobalAccess(): SessionPayload {
  const session = requireSession();
  if (!isGlobalRole(session.role, session.isSuperAdmin)) redirect("/dashboard");
  return session;
}

/** Wajib punya capability tertentu (POS/KDS/inventory/forms). */
export function requireCapability(capability: StaffCapability): SessionPayload {
  const session = requireSession();
  if (!canAccessCapability(session, capability)) redirect("/dashboard");
  return session;
}

type RequireAuthzInput = {
  roles?: Role[];
  outletId?: string | null;
  finance?: boolean;
  global?: boolean;
  capability?: StaffCapability;
  redirectTo?: string;
};

/**
 * Pipeline authorization backend tunggal:
 * requireSession -> role/capability -> scope checks (outlet/finance/global).
 */
export function requireAuthz(input: RequireAuthzInput): SessionPayload {
  const session = requireSession();
  const redirectTo = input.redirectTo ?? "/dashboard";

  if (input.roles && !input.roles.includes(session.role)) {
    redirect(redirectTo);
  }
  if (input.capability && !canAccessCapability(session, input.capability)) {
    redirect(redirectTo);
  }
  if (input.finance && !canAccessFinance(session.role, session.isSuperAdmin)) {
    redirect(redirectTo);
  }
  if (input.global && !isGlobalRole(session.role, session.isSuperAdmin)) {
    redirect(redirectTo);
  }
  if (input.outletId != null && !canAccessOutlet(session, input.outletId)) {
    redirect(`${redirectTo}?error=outlet-denied`);
  }

  return session;
}
