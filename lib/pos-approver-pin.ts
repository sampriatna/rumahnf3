import { USERS } from "./mock-data";
import { verifyPin } from "./pin-crypto";
import { listCashierPins } from "./db/auth-repo";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";
import { isRole } from "./types";

const APPROVER_ROLES = new Set(["leader", "admin", "owner"]);

export type ApproverPinResult =
  | { ok: true; approverName: string }
  | { ok: false; reason: string };

/** Verifikasi PIN leader/admin/owner untuk aksi POS (diskon manual, dll). */
export async function verifyPosApproverPin(
  outletId: string,
  pin: string
): Promise<ApproverPinResult> {
  const clean = pin.trim();
  if (!clean || clean.length < 4) {
    return { ok: false, reason: "PIN wajib diisi (min. 4 digit)." };
  }

  for (const u of USERS) {
    if (!APPROVER_ROLES.has(u.role)) continue;
    if (u.role === "leader" && u.outletId !== outletId) continue;
    if (u.pin === clean) return { ok: true, approverName: u.name };
  }

  if (isSupabaseConfigured()) {
    try {
      const pins = await listCashierPins(outletId);
      for (const p of pins) {
        if (!p.active || !APPROVER_ROLES.has(p.role)) continue;
        if (await verifyPin(clean, p.pinHash)) {
          return { ok: true, approverName: p.label };
        }
      }

      const { data } = await supabaseAdmin()
        .from("auth_accounts")
        .select("full_name,role,outlet_id,pin_hash,active")
        .eq("active", true)
        .in("role", ["leader", "admin", "owner"]);

      for (const row of data ?? []) {
        if (!isRole(row.role) || !APPROVER_ROLES.has(row.role)) continue;
        if (row.role === "leader" && row.outlet_id !== outletId) continue;
        if (!row.pin_hash) continue;
        if (await verifyPin(clean, row.pin_hash)) {
          return { ok: true, approverName: row.full_name };
        }
      }
    } catch {
      /* fallback mock sudah dicoba */
    }
  }

  return { ok: false, reason: "PIN tidak valid atau bukan leader outlet ini." };
}
