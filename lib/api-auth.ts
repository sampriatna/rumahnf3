import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "./session";
import { canAccessFinance, canAccessOutlet, isGlobalRole } from "./data-scope";
import { canAccessCapability } from "./staff-capability";
import type { Role, StaffCapability } from "./types";
import { verifyCronAuth } from "./prod-readiness";

export type ApiAuthzInput = {
  roles?: Role[];
  outletId?: string | null;
  finance?: boolean;
  global?: boolean;
  capability?: StaffCapability;
};

export type ApiAuthzResult =
  | { ok: true; session: SessionPayload }
  | { ok: false; response: NextResponse };

export function apiUnauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: "unauthorized", message }, { status: 401 });
}

export function apiForbidden(message = "forbidden", messageDetail?: string) {
  return NextResponse.json(
    { error: "forbidden", message: messageDetail ?? "Forbidden" },
    { status: 403 }
  );
}

/**
 * Pipeline authorization untuk route handler API.
 * Mengembalikan JSON 401/403 — tidak redirect.
 */
export function requireApiAuthz(input: ApiAuthzInput): ApiAuthzResult {
  const session = getSession();
  if (!session) {
    return { ok: false, response: apiUnauthorized() };
  }

  if (input.roles && !input.roles.includes(session.role)) {
    return { ok: false, response: apiForbidden() };
  }
  if (input.capability && !canAccessCapability(session, input.capability)) {
    return { ok: false, response: apiForbidden() };
  }
  if (input.finance && !canAccessFinance(session.role, session.isSuperAdmin)) {
    return { ok: false, response: apiForbidden() };
  }
  if (input.global && !isGlobalRole(session.role, session.isSuperAdmin)) {
    return { ok: false, response: apiForbidden() };
  }
  if (input.outletId != null && !canAccessOutlet(session, input.outletId)) {
    return { ok: false, response: apiForbidden("outlet-denied") };
  }

  return { ok: true, session };
}

/** Izinkan akses diagnostik via session global atau bearer CRON_SECRET. */
export function requireOpsDiagnosticsAuth(req: Request): ApiAuthzResult | { ok: true; session?: SessionPayload } {
  const cron = verifyCronAuth(req);
  if (cron.ok) return { ok: true };

  const authz = requireApiAuthz({ global: true });
  if (authz.ok) return authz;

  if (cron.status === 401) {
    return { ok: false, response: apiUnauthorized() };
  }

  return authz;
}
