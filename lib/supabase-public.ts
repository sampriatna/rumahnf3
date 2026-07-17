import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Klien service-role untuk schema `public` (Catatin / nf3-ebon).
 * Rumah NF3 pakai schema `nf3`; laporan kasir Catatin ada di public.app_state.
 */
let _publicAdmin: SupabaseClient<any, any, any> | null = null;

export function supabasePublicAdmin(): SupabaseClient<any, any, any> {
  if (typeof window !== "undefined") {
    throw new Error("supabasePublicAdmin() tidak boleh dipanggil di browser.");
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Kredensial Supabase belum diset.");
  }
  if (!_publicAdmin) {
    _publicAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      db: { schema: "public" }
    });
  }
  return _publicAdmin;
}
