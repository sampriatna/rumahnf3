import { isSupabaseConfigured } from "./supabase";
import { supabasePublicAdmin } from "./supabase-public";
import { formatRp } from "./finance";

/**
 * Laporan harian kasir Catatin — disimpan di public.app_state.data.dailyReports.
 * Owner & kasir = satu baris app_state per business_id (RLS is_business_member), bukan API terpisah.
 */
export type CatatinDailyReport = {
  id: string;
  date: string;
  outlet: string;
  kasirId?: string;
  kasirName?: string;
  channels?: Record<string, number>;
  totalOmset?: number;
  status?: string;
  submittedAt?: string;
  settledAt?: string;
  note?: string;
};

export type CatatinDailyReportsLoad = {
  reports: CatatinDailyReport[];
  source: "supabase" | "unconfigured" | "empty" | "error";
  businessId?: string;
  updatedAt?: string;
  message?: string;
};

export function catatinBusinessId(): string | undefined {
  return process.env.NF3_CATATIN_BUSINESS_ID?.trim() || undefined;
}

export function isCatatinReportsEnabled(): boolean {
  return isSupabaseConfigured() && Boolean(catatinBusinessId());
}

function reportTimestamp(r: CatatinDailyReport): number {
  const raw = r.submittedAt ?? r.date;
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
}

function channelTotal(r: CatatinDailyReport): number {
  if (typeof r.totalOmset === "number" && r.totalOmset > 0) return r.totalOmset;
  if (!r.channels) return 0;
  return Object.values(r.channels).reduce((sum, n) => sum + (Number(n) || 0), 0);
}

function normalizeReport(raw: Record<string, unknown>): CatatinDailyReport {
  const channels =
    raw.channels && typeof raw.channels === "object" && !Array.isArray(raw.channels)
      ? (raw.channels as Record<string, number>)
      : undefined;

  return {
    id: String(raw.id ?? ""),
    date: String(raw.date ?? ""),
    outlet: String(raw.outlet ?? "—"),
    kasirId: raw.kasirId != null ? String(raw.kasirId) : undefined,
    kasirName: raw.kasirName != null ? String(raw.kasirName) : undefined,
    channels,
    totalOmset: raw.totalOmset != null ? Number(raw.totalOmset) : undefined,
    status: raw.status != null ? String(raw.status) : undefined,
    submittedAt: raw.submittedAt != null ? String(raw.submittedAt) : undefined,
    settledAt: raw.settledAt != null ? String(raw.settledAt) : undefined,
    note: raw.note != null ? String(raw.note) : undefined
  };
}

/** Laporan kasir N hari terakhir — baca baris app_state yang sama dengan HP kasir Catatin. */
export async function loadCatatinDailyReports(days = 14): Promise<CatatinDailyReportsLoad> {
  const businessId = catatinBusinessId();
  if (!businessId) {
    return {
      reports: [],
      source: "unconfigured",
      message: "Set NF3_CATATIN_BUSINESS_ID di env Vercel (UUID bisnis Catatin)."
    };
  }
  if (!isSupabaseConfigured()) {
    return { reports: [], source: "error", message: "Supabase belum dikonfigurasi." };
  }

  try {
    const db = supabasePublicAdmin();
    const { data, error } = await db
      .from("app_state")
      .select("data, updated_at")
      .eq("business_id", businessId)
      .maybeSingle();

    if (error) {
      return {
        reports: [],
        source: "error",
        businessId,
        message: error.message
      };
    }

    const payload = data?.data as { dailyReports?: unknown[] } | null;
    const rawList = Array.isArray(payload?.dailyReports) ? payload!.dailyReports! : [];

    if (!rawList.length) {
      return {
        reports: [],
        source: "empty",
        businessId,
        updatedAt: data?.updated_at ?? undefined,
        message: "Belum ada dailyReports di app_state — kasir belum submit atau business_id salah."
      };
    }

    const cutoff = Date.now() - days * 86_400_000;
    const reports = rawList
      .map((row) => normalizeReport(row as Record<string, unknown>))
      .filter((r) => r.id && reportTimestamp(r) >= cutoff)
      .sort((a, b) => reportTimestamp(b) - reportTimestamp(a));

    return {
      reports,
      source: "supabase",
      businessId,
      updatedAt: data?.updated_at ?? undefined
    };
  } catch (e) {
    return {
      reports: [],
      source: "error",
      businessId,
      message: e instanceof Error ? e.message : "Gagal memuat app_state Catatin."
    };
  }
}

export function sumCatatinChannelTotal(reports: CatatinDailyReport[]): number {
  return reports.reduce((sum, r) => sum + channelTotal(r), 0);
}

export { channelTotal, formatRp as formatCatatinRp };
