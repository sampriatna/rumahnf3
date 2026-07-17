import { supabaseAdmin } from "../supabase";
import type { AiInsight } from "../ai-advisor";
import type { Submission } from "../store";

// ============================================================================
// Repository relasional Reports / AI (Fase D2b lanjutan).
// customer_ratings = sync denormalisasi dari form lapor_kendala (write-through).
// Daily report tetap computed on-the-fly di lib/reports.ts.
// ============================================================================

export type CustomerRating = {
  id: string;
  outletId?: string;
  outletName?: string;
  source: string;
  category: string;
  rating?: string;
  comment: string;
  status: string;
  submissionId?: string;
  createdAt: string;
};

export type ReportsSnapshot = {
  aiInsights: AiInsight[];
  customerRatings: CustomerRating[];
};

const n = <T>(v: T | undefined): T | null => (v === undefined ? null : v);
const u = <T>(v: T | null): T | undefined => (v === null ? undefined : v);

/** Derive rating rows dari submission komplain pelanggan + lapor kendala. */
export function ratingsFromSubmissions(submissions: Submission[]): CustomerRating[] {
  return submissions
    .filter((s) => s.formType === "komplain_pelanggan" || s.formType === "lapor_kendala")
    .map((s) => ({
      id: s.id,
      outletId: s.outletId,
      outletName: s.outletName,
      source: s.formType === "komplain_pelanggan" ? "Komplain Pelanggan" : "Laporan Internal",
      category: s.payload.kategori ?? s.payload.jenis ?? "Lainnya",
      rating: s.payload.rating,
      comment: s.payload.cerita ?? s.payload.deskripsi ?? "—",
      status: s.status,
      submissionId: s.id,
      createdAt: s.createdAt
    }));
}

// ---- map: app -> row -------------------------------------------------------
const insightRow = (i: AiInsight, scopeOutletId?: string) => ({
  id: i.id,
  generated_at: i.generatedAt,
  scope_outlet_id: n(scopeOutletId),
  ringkasan: i.ringkasan,
  bukti: i.bukti ?? [],
  analisa: i.analisa ?? [],
  risiko: i.risiko ?? [],
  rekomendasi: i.rekomendasi ?? [],
  prioritas: i.prioritas ?? []
});

const ratingRow = (r: CustomerRating) => ({
  id: r.id,
  outlet_id: n(r.outletId),
  outlet_name: n(r.outletName),
  source: r.source,
  category: r.category,
  rating: n(r.rating),
  comment: r.comment,
  status: r.status,
  submission_id: n(r.submissionId),
  created_at: r.createdAt
});

// ---- map: row -> app -------------------------------------------------------
const toInsight = (r: any): AiInsight => ({
  id: r.id,
  generatedAt: r.generated_at,
  ringkasan: r.ringkasan,
  bukti: Array.isArray(r.bukti) ? r.bukti : [],
  analisa: Array.isArray(r.analisa) ? r.analisa : [],
  risiko: Array.isArray(r.risiko) ? r.risiko : [],
  rekomendasi: Array.isArray(r.rekomendasi) ? r.rekomendasi : [],
  prioritas: Array.isArray(r.prioritas) ? r.prioritas : []
});

const toRating = (r: any): CustomerRating => ({
  id: r.id,
  outletId: u(r.outlet_id),
  outletName: u(r.outlet_name),
  source: r.source,
  category: r.category,
  rating: u(r.rating),
  comment: r.comment,
  status: r.status,
  submissionId: u(r.submission_id),
  createdAt: r.created_at
});

const COLS = {
  ai_insights:
    "id,generated_at,scope_outlet_id,ringkasan,bukti,analisa,risiko,rekomendasi,prioritas",
  customer_ratings:
    "id,outlet_id,outlet_name,source,category,rating,comment,status,submission_id,created_at"
} as const;

/** Tulis state reports ke tabel relasional (idempotent). */
export async function pushReports(snap: ReportsSnapshot): Promise<void> {
  try {
    const db = supabaseAdmin();
    if (snap.aiInsights.length) {
      await db.from("ai_insights").upsert(snap.aiInsights.map((i) => insightRow(i)) as never[], {
        onConflict: "id"
      });
    }
    if (snap.customerRatings.length) {
      await db.from("customer_ratings").upsert(snap.customerRatings.map(ratingRow) as never[], {
        onConflict: "id"
      });
    }
  } catch {
    /* abaikan — relasional opsional */
  }
}

/** Baca state reports dari relasional. null bila tabel belum ada. */
export async function pullReports(): Promise<ReportsSnapshot | null> {
  try {
    const db = supabaseAdmin();
    const { error: probeErr } = await db
      .from("ai_insights")
      .select("id", { count: "exact", head: true });
    if (probeErr) return null;

    const sel = async (t: keyof typeof COLS) => {
      const { data, error } = await db.from(t).select(COLS[t], { count: "exact" });
      if (error) return [] as any[];
      return (data ?? []) as any[];
    };
    const insights = await sel("ai_insights");
    const ratings = await sel("customer_ratings");
    return {
      aiInsights: insights.map(toInsight),
      customerRatings: ratings.map(toRating)
    };
  } catch {
    return null;
  }
}
