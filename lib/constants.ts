// Konstanta global Rumah NF3.

export const APP_NAME = "Rumah NF3";
export const APP_TAGLINE = "Internal Command Center & ERP Lite";

// Task Dashboard existing. TIDAK di-rebuild — hanya di-link dari "Ruang Task".
// Bisa dioverride via env NEXT_PUBLIC_TASK_DASHBOARD_URL.
export const TASK_DASHBOARD_URL =
  process.env.NEXT_PUBLIC_TASK_DASHBOARD_URL ?? "https://task.nf3.company";

// GAWE / E-Presensi GPS V2 (Laravel di cPanel). TIDAK di-rebuild — link-out saja.
export const ATTENDANCE_URL =
  process.env.NEXT_PUBLIC_ATTENDANCE_URL?.replace(/\/$/, "") ?? "https://squadnf3.id";

/** URL publik app (production). Kosong di dev = relative paths. */
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";

/** Subdomain POS & KDS (production). */
export const POS_URL = process.env.NEXT_PUBLIC_POS_URL?.replace(/\/$/, "") ?? "";
export const KDS_URL = process.env.NEXT_PUBLIC_KDS_URL?.replace(/\/$/, "") ?? "";
export const STAFF_URL = process.env.NEXT_PUBLIC_STAFF_URL?.replace(/\/$/, "") ?? "";

// Cookie sementara untuk memilih role pada fase skeleton (belum ada login asli).
export const DEMO_ROLE_COOKIE = "nf3_demo_role";
