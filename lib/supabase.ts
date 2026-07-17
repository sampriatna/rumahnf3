import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Klien Supabase untuk Rumah NF3.
//   • adminClient  : service-role key, HANYA server (bypass RLS). Untuk service/repo.
//   • anonClient   : publishable/anon key, boleh di browser (terikat RLS nanti).
// Env dibaca dari .env.local (lihat .env.local). Semua lazy singleton.
// ============================================================================

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let _admin: SupabaseClient<any, any, any> | null = null;
let _anon: SupabaseClient<any, any, any> | null = null;

/** True bila kredensial Supabase tersedia (untuk fallback ke in-memory). */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey);
}

/** Klien service-role — HANYA dipakai di server (server action / route / RSC). */
export function supabaseAdmin(): SupabaseClient<any, any, any> {
  if (typeof window !== "undefined") {
    throw new Error("supabaseAdmin() tidak boleh dipanggil di browser.");
  }
  if (!url || !serviceKey) {
    throw new Error("Kredensial Supabase belum diset (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  }
  if (!_admin) {
    _admin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "nf3" }
    });
  }
  return _admin;
}

/** Klien anon — aman untuk browser (akses dibatasi RLS). */
export function supabaseAnon(): SupabaseClient<any, any, any> {
  if (!url || !anonKey) {
    throw new Error("Kredensial Supabase anon belum diset.");
  }
  if (!_anon) {
    _anon = createClient(url, anonKey, { db: { schema: "nf3" } });
  }
  return _anon;
}
