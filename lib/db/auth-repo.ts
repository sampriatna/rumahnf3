import { supabaseAdmin } from "../supabase";
import type { Role, StaffCapability } from "../types";
import { isRole } from "../types";
import { USERS } from "../mock-data";
// ============================================================================
// Repository Auth (Fase D3): auth_accounts + outlet_cashier_pins
// ============================================================================

export type AuthAccount = {
  id: string;
  authUserId?: string;
  email?: string;
  phone?: string;
  fullName: string;
  role: Role;
  outletId?: string;
  isSuperAdmin: boolean;
  pinHash?: string;
  active: boolean;
  capabilities?: StaffCapability[];
  createdAt: string;
  updatedAt: string;
};

const CAPS: StaffCapability[] = ["pos", "kds", "inventory", "forms"];

export function parseCapabilities(raw: unknown): StaffCapability[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const valid = raw.filter((c): c is StaffCapability => typeof c === "string" && CAPS.includes(c as StaffCapability));
  return valid.length ? valid : undefined;
}

function mockAccountsFromUsers(): AuthAccount[] {
  const now = new Date().toISOString();
  return USERS.filter((u) => isRole(u.role)).map((u) => ({
    id: u.id,
    phone: u.phone,
    fullName: u.name,
    role: u.role as Role,
    outletId: u.outletId,
    isSuperAdmin: false,
    pinHash: undefined,
    active: true,
    capabilities: u.capabilities,
    createdAt: now,
    updatedAt: now
  }));
}
export type OutletCashierPin = {
  id: string;
  outletId: string;
  outletName?: string;
  label: string;
  pinHash: string;
  role: Role;
  active: boolean;
  createdById?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
};

const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);
const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);

const COLS = {
  auth_accounts:
    "id,auth_user_id,email,phone,full_name,role,outlet_id,is_super_admin,pin_hash,active,capabilities,created_at,updated_at",
  outlet_cashier_pins:
    "id,outlet_id,outlet_name,label,pin_hash,role,active,created_by_id,created_by_name,created_at,updated_at"
} as const;

const accountRow = (a: AuthAccount) => ({
  id: a.id,
  auth_user_id: n(a.authUserId),
  email: n(a.email),
  phone: n(a.phone),
  full_name: a.fullName,
  role: a.role,
  outlet_id: n(a.outletId),
  is_super_admin: a.isSuperAdmin,
  pin_hash: n(a.pinHash),
  active: a.active,
  capabilities: a.capabilities?.length ? a.capabilities : ["forms"],
  created_at: a.createdAt,
  updated_at: a.updatedAt
});

const pinRow = (p: OutletCashierPin) => ({
  id: p.id,
  outlet_id: p.outletId,
  outlet_name: n(p.outletName),
  label: p.label,
  pin_hash: p.pinHash,
  role: p.role,
  active: p.active,
  created_by_id: n(p.createdById),
  created_by_name: n(p.createdByName),
  created_at: p.createdAt,
  updated_at: p.updatedAt
});

const toAccount = (r: any): AuthAccount | null => {
  if (!isRole(r.role)) return null;
  return {
    id: r.id,
    authUserId: u(r.auth_user_id),
    email: u(r.email),
    phone: u(r.phone),
    fullName: r.full_name,
    role: r.role,
    outletId: u(r.outlet_id),
    isSuperAdmin: Boolean(r.is_super_admin),
    pinHash: u(r.pin_hash),
    active: r.active,
    capabilities: parseCapabilities(r.capabilities),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
};

export const toCashierPin = (r: any): OutletCashierPin | null => {
  if (!isRole(r.role)) return null;
  return {
    id: r.id,
    outletId: r.outlet_id,
    outletName: u(r.outlet_name),
    label: r.label,
    pinHash: r.pin_hash,
    role: r.role,
    active: r.active,
    createdById: u(r.created_by_id),
    createdByName: u(r.created_by_name),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
};

async function tableReady(table: keyof typeof COLS): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin().from(table).select("id", { count: "exact", head: true });
    return !error;
  } catch {
    return false;
  }
}

export async function getAccountByEmail(email: string): Promise<AuthAccount | null> {
  if (!(await tableReady("auth_accounts"))) return null;
  const { data, error } = await supabaseAdmin()
    .from("auth_accounts")
    .select(COLS.auth_accounts)
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (error || !data) return null;
  return toAccount(data);
}

export async function getAccountByAuthUserId(authUserId: string): Promise<AuthAccount | null> {
  if (!(await tableReady("auth_accounts"))) return null;
  const { data, error } = await supabaseAdmin()
    .from("auth_accounts")
    .select(COLS.auth_accounts)
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error || !data) return null;
  return toAccount(data);
}

export async function getAccountByPhone(phone: string): Promise<AuthAccount | null> {
  if (!(await tableReady("auth_accounts"))) return null;
  const { data, error } = await supabaseAdmin()
    .from("auth_accounts")
    .select(COLS.auth_accounts)
    .eq("phone", phone.trim())
    .maybeSingle();
  if (error || !data) return null;
  return toAccount(data);
}

export async function getAccountById(id: string): Promise<AuthAccount | null> {
  if (!(await tableReady("auth_accounts"))) return null;
  const { data, error } = await supabaseAdmin()
    .from("auth_accounts")
    .select(COLS.auth_accounts)
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return toAccount(data);
}

export async function listAuthAccounts(roleFilter?: Role[]): Promise<AuthAccount[]> {
  if (!(await tableReady("auth_accounts"))) return mockAccountsFromUsers();
  let q = supabaseAdmin().from("auth_accounts").select(COLS.auth_accounts);
  if (roleFilter?.length) q = q.in("role", roleFilter);
  const { data, error } = await q.order("full_name");
  if (error || !data) return mockAccountsFromUsers();
  return data.map(toAccount).filter(Boolean) as AuthAccount[];
}

export async function setAuthAccountActive(id: string, active: boolean): Promise<boolean> {
  if (!(await tableReady("auth_accounts"))) return false;
  const { error } = await supabaseAdmin()
    .from("auth_accounts")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function upsertAuthAccount(account: AuthAccount): Promise<boolean> {
  if (!(await tableReady("auth_accounts"))) return false;
  const { error } = await supabaseAdmin()
    .from("auth_accounts")
    .upsert(accountRow(account) as never, { onConflict: "id" });
  return !error;
}

export async function listCashierPins(outletId?: string): Promise<OutletCashierPin[]> {
  if (!(await tableReady("outlet_cashier_pins"))) return [];
  let q = supabaseAdmin().from("outlet_cashier_pins").select(COLS.outlet_cashier_pins);
  if (outletId) q = q.eq("outlet_id", outletId);
  const { data, error } = await q.order("outlet_id").order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(toCashierPin).filter(Boolean) as OutletCashierPin[];
}

export async function upsertCashierPin(pin: OutletCashierPin): Promise<boolean> {
  if (!(await tableReady("outlet_cashier_pins"))) return false;
  const { error } = await supabaseAdmin()
    .from("outlet_cashier_pins")
    .upsert(pinRow(pin) as never, { onConflict: "id" });
  return !error;
}

export async function setCashierPinActive(id: string, active: boolean): Promise<boolean> {
  if (!(await tableReady("outlet_cashier_pins"))) return false;
  const { error } = await supabaseAdmin()
    .from("outlet_cashier_pins")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", id);
  return !error;
}

export async function countAuthRows(): Promise<{ accounts: number; cashierPins: number } | null> {
  if (!(await tableReady("auth_accounts"))) return null;
  const db = supabaseAdmin();
  const a = await db.from("auth_accounts").select("id", { count: "exact", head: true });
  const p = await db.from("outlet_cashier_pins").select("id", { count: "exact", head: true });
  return { accounts: a.count ?? 0, cashierPins: p.count ?? 0 };
}
