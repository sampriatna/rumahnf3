import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";

export type RlsDiagnostics = {
  enabledTables: number;
  policyCount: number;
};

/** Cek RLS aktif di schema nf3 (butuh rls-policies.sql + fungsi rls_diagnostics). */
export async function getRlsDiagnostics(): Promise<RlsDiagnostics | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await supabaseAdmin().rpc("rls_diagnostics");
    if (error || !data) return null;
    const d = data as RlsDiagnostics;
    if (typeof d.enabledTables !== "number") return null;
    return d;
  } catch {
    return null;
  }
}
