/**
 * Buat super admin di Supabase Auth + nf3.auth_accounts.
 * Jalankan: npm run seed:admin
 * Prasyarat: .env.local + supabase/auth-app.sql sudah dijalankan.
 */
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.NF3_SUPER_ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.NF3_SUPER_ADMIN_PASSWORD;
const name = process.env.NF3_SUPER_ADMIN_NAME ?? "Super Admin";

if (!url || !serviceKey || !email || !password) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NF3_SUPER_ADMIN_EMAIL, NF3_SUPER_ADMIN_PASSWORD di .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: "nf3" }
});

const now = new Date().toISOString();

let authUserId;
const { data: created, error: createErr } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: { full_name: name, role: "owner" }
});

if (created?.user) {
  authUserId = created.user.id;
  console.log("Auth user created:", authUserId);
} else if (createErr?.message?.includes("already") || createErr?.message?.includes("registered")) {
  const { data: list } = await admin.auth.admin.listUsers();
  const found = list.users.find((u) => u.email?.toLowerCase() === email);
  if (!found) {
    console.error("createUser error:", createErr.message);
    process.exit(1);
  }
  authUserId = found.id;
  await admin.auth.admin.updateUserById(found.id, { password });
  console.log("Auth user updated:", authUserId);
} else {
  console.error("createUser error:", createErr?.message ?? "unknown");
  process.exit(1);
}

const { error: profileErr } = await admin.from("auth_accounts").upsert(
  {
    id: "u-super-admin",
    auth_user_id: authUserId,
    email,
    full_name: name,
    role: "owner",
    is_super_admin: true,
    active: true,
    created_at: now,
    updated_at: now
  },
  { onConflict: "id" }
);

if (profileErr) {
  console.error("auth_accounts error:", profileErr.message);
  process.exit(1);
}

// Seed demo staf dengan PIN bcrypt 1234 (HP tetap mock).
const demoPinHash = await bcrypt.hash("1234", 10);
const staff = [
  { id: "u-owner", phone: "0800", full_name: "Owner NF3", role: "owner" },
  { id: "u-admin", phone: "0801", full_name: "Admin Keuangan", role: "admin" },
  { id: "u-leader", phone: "0802", full_name: "Leader KBU", role: "leader", outlet_id: "kbu" },
  { id: "u-staff", phone: "0803", full_name: "Aji (Staf Dapur)", role: "staff", outlet_id: "kbu" }
];

for (const s of staff) {
  const row = {
    id: s.id,
    phone: s.phone,
    full_name: s.full_name,
    role: s.role,
    outlet_id: s.outlet_id ?? null,
    pin_hash: demoPinHash,
    is_super_admin: false,
    active: true,
    created_at: now,
    updated_at: now
  };
  const { error } = await admin.from("auth_accounts").upsert(row, { onConflict: "id" });
  if (error) console.error("staff", s.id, error.message);
  else console.log("staff ok:", s.id);
}

console.log("OK — super admin + demo staff PIN (1234) siap.");
console.log("Login email:", email);
