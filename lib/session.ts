import { cookies } from "next/headers";
import { decodeSessionToken, encodeSessionToken, type SessionPayload } from "./session-token";
import { sessionCookieDomain } from "./subdomains";

export type { SessionPayload } from "./session-token";

// Session cookie bertanda HMAC (pola sama seperti app buri-umah).
// Server-side only (pakai next/headers cookies + node crypto).

const COOKIE = "nf3_session";
const MAX_AGE = 60 * 60 * 12; // 12 jam

export function setSession(data: Omit<SessionPayload, "exp">) {
  const token = encodeSessionToken({ ...data, exp: Math.floor(Date.now() / 1000) + MAX_AGE });
  const domain = sessionCookieDomain();

  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE,
    path: "/",
    ...(domain ? { domain } : {})
  });
}

export function getSession(): SessionPayload | null {
  return decodeSessionToken(cookies().get(COOKIE)?.value);
}

export function clearSession() {
  const domain = sessionCookieDomain();
  cookies().delete({ name: COOKIE, path: "/", ...(domain ? { domain } : {}) });
}