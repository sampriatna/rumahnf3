import { buildDailyReport, buildRatingReport, type DailyReport } from "./reports";
import { OUTLETS } from "./mock-data";
import { getLoyaltySummary } from "./loyalty-service";
import { formatRp } from "./finance";

export type InsightType = "person" | "system" | "business";

export type AiInsight = {
  id: string;
  generatedAt: string;
  /** Ringkasan masalah — 1 paragraf bahasa lapangan. */
  ringkasan: string;
  bukti: string[];
  analisa: { type: InsightType; note: string }[];
  risiko: string[];
  rekomendasi: string[];
  prioritas: string[];
};

/**
 * AI Direktur — advisor berbasis aturan (baca data nyata dari store).
 * BUKAN pengambil keputusan. Ganti dengan LLM API (OPENAI_API_KEY) di fase berikutnya bila perlu.
 */
export function generateAiInsight(scopeOutletId?: string): AiInsight {
  const report = buildDailyReport(scopeOutletId);
  const ratings = buildRatingReport(scopeOutletId);
  const now = new Date().toISOString();

  const bukti: string[] = [];
  const analisa: AiInsight["analisa"] = [];
  const risiko: string[] = [];
  const rekomendasi: string[] = [];
  const prioritas: string[] = [];

  // Outlet paling ramai masalah
  const sortedOutlets = [...report.byOutlet].sort((a, b) => {
    const scoreA = a.stuckCount + a.requestBahanPending + a.wasteCount + a.pendingApprovals;
    const scoreB = b.stuckCount + b.requestBahanPending + b.wasteCount + b.pendingApprovals;
    return scoreB - scoreA;
  });
  const hot = sortedOutlets[0];
  const hotScore =
    hot &&
    hot.stuckCount + hot.requestBahanPending + hot.wasteCount + hot.pendingApprovals;

  if (report.totals.pendingApprovals > 0) {
    bukti.push(`${report.totals.pendingApprovals} approval masih menunggu keputusan.`);
    prioritas.push(`Selesaikan ${report.totals.pendingApprovals} approval pending hari ini.`);
  }

  if (report.totals.requestBahanPending > 0) {
    bukti.push(`${report.totals.requestBahanPending} request bahan belum selesai.`);
    rekomendasi.push("Cek stok gudang untuk request bahan yang urgent — hindari belanja mendadak.");
    analisa.push({
      type: "system",
      note: "Request bahan sering mendadak bisa indikasi minimum stock belum diatur."
    });
  }

  if (report.totals.wasteCount > 0) {
    bukti.push(`${report.totals.wasteCount} laporan waste hari ini.`);
    if (report.wasteHighlights[0]) {
      bukti.push(
        `Waste: ${report.wasteHighlights[0].bahan} (${report.wasteHighlights[0].jumlah}) di ${report.wasteHighlights[0].outlet} — ${report.wasteHighlights[0].alasan}.`
      );
    }
    rekomendasi.push("Review prep batch & FIFO di area dengan waste tinggi.");
    analisa.push({ type: "business", note: "Waste tinggi langsung menggerus margin harian." });
  }

  if (report.totals.setoranTotal > 0) {
    bukti.push(`Total setoran kasir hari ini: Rp ${report.totals.setoranTotal.toLocaleString("id-ID")}.`);
  }

  const selisihOutlets = report.byOutlet.filter((o) => o.setoranSelisih > 0);
  if (selisihOutlets.length > 0) {
    bukti.push(
      `Selisih setoran di: ${selisihOutlets.map((o) => o.outletName).join(", ")}.`
    );
    risiko.push("Selisih kas perlu investigasi sebelum tutup buku harian.");
    analisa.push({ type: "person", note: "Selisih bisa human error kasir ATAU masalah rekonsiliasi POS." });
  }

  if (ratings.belumDitangani > 0) {
    bukti.push(`${ratings.belumDitangani} laporan kendala/komplain belum ditangani.`);
    if (ratings.byCategory[0]) {
      bukti.push(`Keluhan paling sering: ${ratings.byCategory[0].category} (${ratings.byCategory[0].count}x).`);
    }
    rekomendasi.push("Leader follow-up kendala pelanggan yang masih open.");
  }

  if (report.totals.stuckCount > 0) {
    bukti.push(`${report.totals.stuckCount} request/laporan masih open (macet).`);
    analisa.push({
      type: "system",
      note: "Request macet sering karena leader belum verifikasi atau alur approval tertahan."
    });
  }

  // Ringkasan naratif
  let ringkasan: string;
  if (hot && hotScore && hotScore > 0) {
    ringkasan =
      `Masalah utama hari ini condong ke **${hot.outletName}**. ` +
      (hot.requestBahanPending > 0
        ? `Ada ${hot.requestBahanPending} request bahan pending. `
        : "") +
      (hot.wasteCount > 0 ? `Waste tercatat ${hot.wasteCount}x. ` : "") +
      (hot.pendingApprovals > 0 ? `${hot.pendingApprovals} approval menunggu. ` : "") +
      (hot.stuckCount > 0 ? `${hot.stuckCount} request macet. ` : "") +
      `Ini lebih condong ke masalah ${
        hot.requestBahanPending > 0 || hot.wasteCount > 1 ? "sistem stok & kontrol leader" : "operasional harian"
      }, bukan hanya staf malas.`;
  } else if (report.totals.submissionsToday === 0) {
    ringkasan =
      "Belum ada aktivitas form hari ini di data sistem. Pastikan tim sudah pakai Rumah NF3 untuk laporan harian.";
    rekomendasi.push("Ingatkan staf pakai QR shortcut untuk request bahan & waste.");
  } else {
    ringkasan =
      `Operasional hari ini relatif stabil across ${OUTLETS.length} outlet. ${report.totals.submissionsToday} form masuk hari ini. Tetap pantau approval & request open.`;
  }

  if (prioritas.length === 0 && report.totals.pendingApprovals > 0) {
    prioritas.push("Clear approval queue sebelum tutup hari.");
  }
  if (prioritas.length === 0) {
    prioritas.push("Review closing checklist semua outlet malam ini.");
  }
  if (rekomendasi.length === 0) {
    rekomendasi.push("Pertahankan ritme verifikasi task closing maksimal jam 22:30.");
  }
  if (risiko.length === 0 && report.totals.stuckCount > 2) {
    risiko.push("Request macet bisa menumpuk dan mengganggu keputusan owner besok pagi.");
  }

  return {
    id: `AI-${Date.now()}`,
    generatedAt: now,
    ringkasan: ringkasan.replace(/\*\*/g, ""),
    bukti,
    analisa,
    risiko,
    rekomendasi,
    prioritas
  };
}

/** Snapshot data yang dibaca AI (untuk transparansi ke owner). */
export function aiDataSnapshot(scopeOutletId?: string): DailyReport {
  return buildDailyReport(scopeOutletId);
}

export type LoyaltyInsight = {
  generatedAt: string;
  ringkasan: string;
  temuan: string[];
  rekomendasi: string[];
};

/**
 * AI insight khusus program loyalty (rule-based). Menilai efektivitas,
 * deteksi promo boros, pelanggan loyal/tidak aktif, saran kampanye.
 */
export function generateLoyaltyInsight(): LoyaltyInsight {
  const s = getLoyaltySummary();
  const temuan: string[] = [];
  const rekomendasi: string[] = [];

  const redemptionRate =
    s.stampRewardsIssued > 0 ? s.stampRewardsRedeemed / s.stampRewardsIssued : 0;

  if (s.totalMembers === 0) {
    return {
      generatedAt: new Date().toISOString(),
      ringkasan:
        "Belum ada member terdaftar. Mulai dorong kasir menawarkan pendaftaran member saat transaksi kopi.",
      temuan: [],
      rekomendasi: ["Aktifkan pendaftaran member di POS untuk semua outlet."]
    };
  }

  temuan.push(
    `${s.activeMembers} member aktif, ${s.repeatCustomers} repeat customer, ${s.pointsOutstanding} poin beredar.`
  );
  if (s.promoCostTotal > 0) {
    temuan.push(`Total biaya promo loyalty (non-kas): ${formatRp(s.promoCostTotal)}.`);
  }
  if (s.stampRewardsIssued > 0) {
    temuan.push(
      `Reward 10-gratis-1: ${s.stampRewardsRedeemed}/${s.stampRewardsIssued} ditukar (${Math.round(
        redemptionRate * 100
      )}%).`
    );
  }

  // Promo boros: redemption tinggi
  if (redemptionRate >= 0.5 && s.stampRewardsIssued >= 4) {
    rekomendasi.push(
      "Redemption reward tinggi (≥50%). Cek apakah sales ikut naik; jika tidak, perketat syarat stamp."
    );
  } else if (s.stampRewardsIssued > 0) {
    rekomendasi.push("Redemption reward masih aman — program belum bocor.");
  }

  // Pelanggan loyal
  if (s.topSpenders[0]) {
    temuan.push(
      `Pelanggan top: ${s.topSpenders[0].fullName} (${formatRp(s.topSpenders[0].totalSpending)}).`
    );
    rekomendasi.push(`Jaga VIP seperti ${s.topSpenders[0].fullName} — tawarkan reward eksklusif.`);
  }

  // Inactive / winback
  if (s.inactiveCustomers.length > 0) {
    temuan.push(`${s.inactiveCustomers.length} pelanggan lama belum kembali (≥30 hari).`);
    rekomendasi.push(
      `Generate voucher winback untuk ${s.inactiveCustomers.length} pelanggan tidak aktif.`
    );
  }

  // Ultah bulan ini
  if (s.segmentCounts.birthday > 0) {
    rekomendasi.push(
      `${s.segmentCounts.birthday} member ulang tahun bulan ini — terbitkan voucher ulang tahun.`
    );
  }

  // Menu favorit untuk program stamp
  if (s.favoriteMenus[0]) {
    rekomendasi.push(
      `Menu favorit member: ${s.favoriteMenus[0].name}. Cocok untuk program beli-X-gratis-1.`
    );
  }

  const ringkasan =
    `Program loyalty menjangkau ${s.activeMembers} member aktif dengan ${s.pointsOutstanding} poin beredar. ` +
    (s.promoCostTotal > 0
      ? `Biaya promo ${formatRp(s.promoCostTotal)} ${
          redemptionRate >= 0.5 ? "perlu diawasi" : "masih wajar"
        }. `
      : "") +
    (s.inactiveCustomers.length > 0
      ? `Ada ${s.inactiveCustomers.length} pelanggan tidak aktif yang bisa di-winback.`
      : "Retensi pelanggan terlihat sehat.");

  return {
    generatedAt: new Date().toISOString(),
    ringkasan,
    temuan,
    rekomendasi
  };
}
