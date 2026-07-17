import { listApprovals, listForScope, type Submission } from "./store";
import { listOutletRegistry, outletDisplayName, resolveOutletIdentity, toOutletSlug } from "./outlet-identity";

export type OutletReport = {
  outletId: string;
  outletName: string;
  code: string;
  submissionsToday: number;
  pendingRequests: number;
  pendingApprovals: number;
  wasteCount: number;
  kendalaCount: number;
  requestBahanPending: number;
  setoranTotal: number;
  setoranSelisih: number;
  stuckCount: number;
};

export type DailyReport = {
  dateLabel: string;
  generatedAt: string;
  totals: {
    submissionsToday: number;
    pendingApprovals: number;
    pendingRequests: number;
    wasteCount: number;
    kendalaCount: number;
    requestBahanPending: number;
    setoranTotal: number;
    stuckCount: number;
  };
  byOutlet: OutletReport[];
  /** Request macet: menunggu dicek/diproses lama (semua yang masih open). */
  stuckItems: Submission[];
  /** Waste hari ini per item. */
  wasteHighlights: { outlet: string; bahan: string; jumlah: string; alasan: string }[];
};

export type RatingRow = {
  id: string;
  outlet: string;
  source: string;
  category: string;
  rating?: string;
  comment: string;
  status: string;
  createdAt: string;
};

export type RatingReport = {
  total: number;
  byOutlet: { outlet: string; count: number }[];
  byCategory: { category: string; count: number }[];
  belumDitangani: number;
  rows: RatingRow[];
};

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isStuck(sub: Submission) {
  return (
    sub.status === "menunggu_dicek" ||
    sub.status === "diproses" ||
    sub.status === "perlu_revisi"
  );
}

function buildOutletReport(outletId: string, subs: Submission[]): OutletReport {
  const outlet = resolveOutletIdentity(outletId);
  const today = subs.filter((s) => isToday(s.createdAt));
  const pending = subs.filter(isStuck);
  const approvals = listApprovals().filter(
    (a) => a.outletId === outletId && a.status === "pending"
  );

  const waste = subs.filter((s) => s.formType === "waste_bahan");
  const kendala = subs.filter((s) => s.formType === "lapor_kendala");
  const requestBahan = subs.filter(
    (s) => s.formType === "request_bahan" && isStuck(s)
  );
  const setorans = subs.filter((s) => s.formType === "setoran_kasir" && isToday(s.createdAt));
  const setoranTotal = setorans.reduce(
    (sum, s) => sum + (Number(s.payload.total_setoran) || 0),
    0
  );
  const setoranSelisih = setorans.reduce(
    (sum, s) => sum + Math.abs(Number(s.payload.selisih_vs_sistem) || 0),
    0
  );

  return {
    outletId,
    outletName: outlet?.name ?? outletDisplayName(outletId),
    code: outlet?.code ?? "—",
    submissionsToday: today.length,
    pendingRequests: pending.length,
    pendingApprovals: approvals.length,
    wasteCount: waste.filter((w) => isToday(w.createdAt)).length,
    kendalaCount: kendala.filter((k) => isToday(k.createdAt)).length,
    requestBahanPending: requestBahan.length,
    setoranTotal,
    setoranSelisih,
    stuckCount: pending.length
  };
}

export function buildDailyReport(scopeOutletId?: string): DailyReport {
  const scoped = toOutletSlug(scopeOutletId);
  const subs = listForScope(scoped);
  const now = new Date();
  const dateLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  const outletIds = scopeOutletId
    ? [scoped ?? scopeOutletId]
    : listOutletRegistry().map((o) => o.slug);

  const byOutlet = outletIds.map((id) => buildOutletReport(id, listForScope(id)));
  const todaySubs = subs.filter((s) => isToday(s.createdAt));
  const stuckItems = subs.filter(isStuck).slice(0, 10);

  const wasteHighlights = subs
    .filter((s) => s.formType === "waste_bahan" && isToday(s.createdAt))
    .slice(0, 8)
    .map((s) => ({
      outlet: s.outletName ?? "—",
      bahan: s.payload.nama_bahan ?? "—",
      jumlah: `${s.payload.jumlah ?? ""} ${s.payload.satuan ?? ""}`.trim(),
      alasan: s.payload.alasan ?? "—"
    }));

  const pendingApprovals = listApprovals().filter((a) => {
    if (a.status !== "pending") return false;
    if (scopeOutletId) return a.outletId === scopeOutletId;
    return true;
  }).length;

  return {
    dateLabel,
    generatedAt: now.toISOString(),
    totals: {
      submissionsToday: todaySubs.length,
      pendingApprovals,
      pendingRequests: subs.filter(isStuck).length,
      wasteCount: subs.filter((s) => s.formType === "waste_bahan" && isToday(s.createdAt)).length,
      kendalaCount: subs.filter((s) => s.formType === "lapor_kendala" && isToday(s.createdAt)).length,
      requestBahanPending: subs.filter((s) => s.formType === "request_bahan" && isStuck(s)).length,
      setoranTotal: subs
        .filter((s) => s.formType === "setoran_kasir" && isToday(s.createdAt))
        .reduce((sum, s) => sum + (Number(s.payload.total_setoran) || 0), 0),
      stuckCount: subs.filter(isStuck).length
    },
    byOutlet,
    stuckItems,
    wasteHighlights
  };
}

/** Rating/feedback dari komplain pelanggan + lapor kendala (proxy internal). */
export function buildRatingReport(scopeOutletId?: string): RatingReport {
  const subs = listForScope(scopeOutletId).filter(
    (s) => s.formType === "komplain_pelanggan" || s.formType === "lapor_kendala"
  );

  const rows: RatingRow[] = subs.map((s) => ({
    id: s.id,
    outlet: s.outletName ?? "—",
    source: s.formType === "komplain_pelanggan" ? "Komplain Pelanggan" : "Laporan Internal",
    category: s.payload.kategori ?? s.payload.jenis ?? "Lainnya",
    rating: s.payload.rating,
    comment: s.payload.cerita ?? s.payload.deskripsi ?? "—",
    status: s.status,
    createdAt: s.createdAt
  }));

  const byOutletMap = new Map<string, number>();
  const byCatMap = new Map<string, number>();
  for (const r of rows) {
    byOutletMap.set(r.outlet, (byOutletMap.get(r.outlet) ?? 0) + 1);
    byCatMap.set(r.category, (byCatMap.get(r.category) ?? 0) + 1);
  }

  return {
    total: rows.length,
    byOutlet: Array.from(byOutletMap.entries())
      .map(([outlet, count]) => ({ outlet, count }))
      .sort((a, b) => b.count - a.count),
    byCategory: Array.from(byCatMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count),
    belumDitangani: rows.filter((r) => r.status === "menunggu_dicek" || r.status === "diproses").length,
    rows: rows.slice(0, 20)
  };
}

export function formatRp(n: number) {
  return `Rp ${n.toLocaleString("id-ID")}`;
}

/** Aktivitas staf per outlet (untuk evaluasi leader). */
export function staffActivity(outletId: string) {
  const subs = listForScope(outletId);
  const map = new Map<string, { name: string; count: number; lastAt: string }>();
  for (const s of subs) {
    const cur = map.get(s.submittedById) ?? {
      name: s.submittedByName,
      count: 0,
      lastAt: s.createdAt
    };
    cur.count++;
    if (s.createdAt > cur.lastAt) cur.lastAt = s.createdAt;
    map.set(s.submittedById, cur);
  }
  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}
