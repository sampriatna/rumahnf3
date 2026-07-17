import { createHmac, timingSafeEqual } from "crypto";
import type { Role, StaffCapability } from "./types";

export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
  outletId?: string;
  email?: string;
  isSuperAdmin?: boolean;
  capabilities?: StaffCapability[];
  phone?: string;
  exp: number;
};

function secret() {
  const value = process.env.SESSION_SECRET;
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET belum dikonfigurasi.");
  }
  return "dev-insecure-secret-ganti-di-produksi";
}

function sign(body: string) {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

export function encodeSessionToken(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Decode cookie session — dipakai server component & middleware. */
export function decodeSessionToken(token?: string | null): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
