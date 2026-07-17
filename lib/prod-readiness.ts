import { isSupabaseConfigured } from "./supabase";

export type ProdCheck = {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
  hint: string;
};

export type ProdReadinessReport = {
  environment: string;
  isProduction: boolean;
  appUrl?: string;
  checks: ProdCheck[];
  ready: boolean;
  requiredMissing: string[];
};

function hasEnv(name: string): boolean {
  const v = process.env[name];
  return Boolean(v && v.trim().length > 0);
}

/** Checklist env & konfigurasi untuk deploy production (tanpa expose secret). */
export function assessProdReadiness(): ProdReadinessReport {
  const isProduction = process.env.NODE_ENV === "production";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  const checks: ProdCheck[] = [
    {
      id: "session_secret",
      label: "SESSION_SECRET",
      ok: hasEnv("SESSION_SECRET"),
      required: isProduction,
      hint: "Wajib di production — cookie session HMAC (min. 32 karakter acak)."
    },
    {
      id: "cron_secret",
      label: "CRON_SECRET",
      ok: hasEnv("CRON_SECRET"),
      required: isProduction,
      hint: "Wajib di production — lindungi /api/cron/* dari akses publik."
    },
    {
      id: "supabase",
      label: "Supabase (URL + service role)",
      ok: isSupabaseConfigured(),
      required: false,
      hint: "Disarankan — persistensi cloud & auth email."
    },
    {
      id: "app_url",
      label: "NEXT_PUBLIC_APP_URL",
      ok: hasEnv("NEXT_PUBLIC_APP_URL"),
      required: false,
      hint: "URL publik app, mis. https://rumah.nf3.company — untuk link di notifikasi."
    },
    {
      id: "wa_provider",
      label: "WA provider (Fonnte)",
      ok: hasEnv("WA_PROVIDER_TOKEN") && hasEnv("WA_PROVIDER_URL"),
      required: false,
      hint: "Opsional — WA nyata ke leader (tanpa ini tetap log ke dashboard)."
    },
    {
      id: "task_url",
      label: "NEXT_PUBLIC_TASK_DASHBOARD_URL",
      ok: hasEnv("NEXT_PUBLIC_TASK_DASHBOARD_URL"),
      required: false,
      hint: "Link-out Task Dashboard — default https://task.nf3.company"
    },
    {
      id: "inventory_source",
      label: "INVENTORY_SOURCE=supabase",
      ok: (process.env.INVENTORY_SOURCE?.toLowerCase() ?? process.env.FINANCE_SOURCE?.toLowerCase()) === "supabase",
      required: false,
      hint: "Disarankan production — stok multi-outlet dari Supabase Sheets tables."
    },
    {
      id: "task_api",
      label: "TASK_DASHBOARD_API_URL (+ KEY opsional)",
      ok: hasEnv("TASK_DASHBOARD_API_URL") || hasEnv("NEXT_PUBLIC_TASK_DASHBOARD_URL"),
      required: false,
      hint:
        "Opsional — widget Task Telat di dashboard owner. URL otomatis: {NEXT_PUBLIC_TASK_DASHBOARD_URL}/api/integrations/nf3/summary (override penuh via TASK_DASHBOARD_API_URL). KEY opsional: TASK_DASHBOARD_API_KEY."
    }
  ];

  const requiredMissing = checks.filter((c) => c.required && !c.ok).map((c) => c.label);
  const ready = requiredMissing.length === 0;

  return {
    environment: process.env.NODE_ENV ?? "development",
    isProduction,
    appUrl,
    checks,
    ready,
    requiredMissing
  };
}

export function verifyCronAuth(req: Request): { ok: true } | { ok: false; status: number; error: string } {
  const secret = process.env.CRON_SECRET;
  const isProduction = process.env.NODE_ENV === "production";

  if (!secret) {
    if (isProduction) {
      return { ok: false, status: 503, error: "CRON_SECRET belum dikonfigurasi di production." };
    }
    return { ok: true };
  }

  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return { ok: true };
}
