import { createClient } from "@supabase/supabase-js";
import { authenticate as authenticateMock, type AuthUser } from "./auth";
import {
  getAccountByAuthUserId,
  getAccountByEmail,
  getAccountByPhone,
  upsertAuthAccount,
  listCashierPins,
  type AuthAccount
} from "./db/auth-repo";
import { verifyPin } from "./pin-crypto";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";
import { getOutletByIdentity } from "./outlet-identity";
import { isPosOutlet } from "./pos-seed";

export type { AuthUser };

function authClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("Supabase anon belum dikonfigurasi.");
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

function accountToUser(a: AuthAccount): AuthUser {
  return {
    id: a.id,
    name: a.fullName,
    role: a.role,
    outletId: a.outletId,
    phone: a.phone,
    email: a.email,
    isSuperAdmin: a.isSuperAdmin,
    capabilities: a.capabilities
  };
}

export type EmailLoginFailureReason =
  | "missing_fields"
  | "no_supabase"
  | "invalid_credentials"
  | "email_not_confirmed"
  | "account_inactive"
  | "account_not_registered"
  | "server_error";

export type EmailLoginResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: EmailLoginFailureReason };

function mapSupabaseAuthError(message: string): EmailLoginFailureReason {
  const m = message.toLowerCase();
  if (m.includes("invalid login") || m.includes("invalid credentials")) return "invalid_credentials";
  if (m.includes("email not confirmed")) return "email_not_confirmed";
  return "invalid_credentials";
}

/** Login Owner/Admin via email + password (Supabase Auth). */
export async function loginWithEmail(email: string, password: string): Promise<EmailLoginResult> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password) return { ok: false, reason: "missing_fields" };

  if (!isSupabaseConfigured()) return { ok: false, reason: "no_supabase" };

  try {
    const { data, error } = await authClient().auth.signInWithPassword({
      email: normalized,
      password
    });
    if (error || !data.user) {
      return {
        ok: false,
        reason: error ? mapSupabaseAuthError(error.message) : "invalid_credentials"
      };
    }

    let account = await getAccountByAuthUserId(data.user.id);
    if (!account) account = await getAccountByEmail(normalized);

    if (account) {
      if (!account.active) return { ok: false, reason: "account_inactive" };
      if (!account.authUserId) {
        await upsertAuthAccount({ ...account, authUserId: data.user.id, updatedAt: new Date().toISOString() });
      }
      return { ok: true, user: accountToUser(account) };
    }

    // Auto-provision super admin dari env (sekali, setelah seed:admin).
    const envEmail = process.env.NF3_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
    if (envEmail && normalized === envEmail) {
      const now = new Date().toISOString();
      const provision: AuthAccount = {
        id: "u-super-admin",
        authUserId: data.user.id,
        email: normalized,
        fullName: process.env.NF3_SUPER_ADMIN_NAME ?? "Super Admin",
        role: "owner",
        isSuperAdmin: true,
        active: true,
        createdAt: now,
        updatedAt: now
      };
      await upsertAuthAccount(provision);
      return { ok: true, user: accountToUser(provision) };
    }

    return { ok: false, reason: "account_not_registered" };
  } catch {
    return { ok: false, reason: "server_error" };
  }
}

/** Login staf/leader via nomor HP + PIN (bcrypt di auth_accounts). */
export async function loginWithPhonePin(phone: string, pin: string): Promise<AuthUser | null> {
  const cleanPhone = phone.trim();
  const cleanPin = pin.trim();
  if (!cleanPhone || !cleanPin) return null;

  if (isSupabaseConfigured()) {
    try {
      const account = await getAccountByPhone(cleanPhone);
      if (account?.active && account.pinHash && (await verifyPin(cleanPin, account.pinHash))) {
        return accountToUser(account);
      }
    } catch {
      /* fallback mock */
    }
  }

  return authenticateMock(cleanPhone, cleanPin);
}

export type OutletCashierSession = {
  id: string;
  label: string;
  outletId: string;
  outletName: string;
};

/** Login POS tablet: pilih outlet → PIN kasir (ESB-style), bukan akun pribadi. */
export async function loginWithOutletCashierPin(
  outletId: string,
  pin: string
): Promise<OutletCashierSession | null> {
  const cleanPin = pin.trim();
  if (!cleanPin || cleanPin.length < 4) return null;

  if (!isPosOutlet(outletId)) return null;
  const outlet = getOutletByIdentity(outletId);
  if (!outlet) return null;

  if (isSupabaseConfigured()) {
    try {
      const pins = await listCashierPins(outletId);
      for (const p of pins) {
        if (p.active && (await verifyPin(cleanPin, p.pinHash))) {
          return { id: p.id, label: p.label, outletId, outletName: outlet.name };
        }
      }
    } catch {
      /* fallback dev */
    }
  }

  // Dev / fallback bila belum ada PIN di DB — PIN demo 1234 per outlet F&B.
  if (cleanPin === "1234") {
    return { id: `mock-kasir-${outletId}`, label: "Kasir", outletId, outletName: outlet.name };
  }

  return null;
}

/** Buat / perbarui akun Supabase Auth + profil (dipakai script seed). */
export async function ensureSupabaseAuthUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: AuthAccount["role"];
  id: string;
  isSuperAdmin?: boolean;
  phone?: string;
  pinHash?: string;
  outletId?: string;
}): Promise<{ ok: boolean; authUserId?: string; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: false, error: "Supabase belum dikonfigurasi" };

  const email = input.email.trim().toLowerCase();
  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  let authUserId: string | undefined;

  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, role: input.role }
  });

  if (created.user) {
    authUserId = created.user.id;
  } else if (
    createErr?.message?.includes("already been registered") ||
    createErr?.message?.includes("already exists")
  ) {
    const { data: list } = await admin.auth.admin.listUsers();
    const found = list.users.find((u) => u.email?.toLowerCase() === email);
    if (!found) return { ok: false, error: createErr.message };
    authUserId = found.id;
    await admin.auth.admin.updateUserById(found.id, { password: input.password });
  } else if (createErr) {
    return { ok: false, error: createErr.message };
  }

  if (!authUserId) return { ok: false, error: "Gagal mendapatkan auth user id" };

  const ok = await upsertAuthAccount({
    id: input.id,
    authUserId,
    email,
    phone: input.phone,
    fullName: input.fullName,
    role: input.role,
    outletId: input.outletId,
    isSuperAdmin: input.isSuperAdmin ?? false,
    pinHash: input.pinHash,
    active: true,
    createdAt: now,
    updatedAt: now
  });

  return ok ? { ok: true, authUserId } : { ok: false, error: "Gagal simpan auth_accounts" };
}
