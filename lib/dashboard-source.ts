import type { DashboardAiInsight, DashboardData, DashboardWidgetHints, RingkasanHariIni } from "@/types/dashboard";
import { todayIso } from "./date-format";
import { formatRupiah } from "./format-rupiah";
import { getFinanceSummary } from "./finance-service";
import { computeInventoryMetrics } from "./inventory-metrics";
import { loadInventoryBundle } from "./inventory-bundle-loader";
import { getPosSalesToday } from "./pos-sales";
import { buildDailyReport } from "./reports";
import { getLatestAiInsight } from "./store";
import { fetchTaskOverdueCount } from "./task-dashboard-client";

async function loadStokKritisCount(today: string): Promise<number> {
  try {
    const { bahanList, lokasiList, bundle } = await loadInventoryBundle();
    if (bahanList.length === 0) return 0;

    const metrics = computeInventoryMetrics(bahanList, lokasiList, bundle, today);
    return metrics.stokKritisBeli + metrics.stokKritisWaspada;
  } catch {
    return 0;
  }
}

function loadAiInsightPreview(): DashboardAiInsight | null {
  const latest = getLatestAiInsight();
  if (!latest?.ringkasan) return null;

  const preview =
    latest.ringkasan.length > 140 ? `${latest.ringkasan.slice(0, 137)}…` : latest.ringkasan;

  return {
    preview,
    generatedAt: latest.generatedAt
  };
}

function buildHints(ringkasan: RingkasanHariIni, taskMessage: string, posSource: string, aiInsight: DashboardAiInsight | null): DashboardWidgetHints {
  return {
    kasTersedia:
      ringkasan.kasTertahan != null && ringkasan.kasTertahan > 0
        ? `Cash fisik + bank · tertahan ${formatRupiah(ringkasan.kasTertahan)}`
        : "Cash fisik + bank (belum dikurangi utang)",
    freeCash:
      ringkasan.utangJatuhTempo != null && ringkasan.utangJatuhTempo > 0
        ? `Free cash = kas tersedia − utang 7 hari (${formatRupiah(ringkasan.utangJatuhTempo)})`
        : "Free cash = kas tersedia − utang wajib 7 hari",
    kasMasukHariIni:
      ringkasan.kasMasukHariIni != null && ringkasan.kasMasukHariIni > 0
        ? "Dari ledger finance"
        : "Belum ada setoran",
    kasKeluarHariIni:
      ringkasan.kasKeluarHariIni != null && ringkasan.kasKeluarHariIni > 0
        ? "Dari ledger finance"
        : "Belum ada pengeluaran",
    requestBahanPending:
      ringkasan.requestBahanPending > 0 ? "Perlu tindak lanjut" : "OK",
    stokKritis: ringkasan.stokKritis > 0 ? "Perlu belanja/transfer" : "Aman",
    taskTelat: taskMessage,
    approvalMenunggu: ringkasan.approvalMenunggu > 0 ? "Perlu keputusan" : "Kosong",
    posSalesHariIni:
      ringkasan.posSalesHariIni != null && ringkasan.posSalesHariIni > 0
        ? `${posSource} · ${ringkasan.posOrderCountHariIni} order`
        : "Belum ada penjualan",
    requestMacet: ringkasan.requestMacet > 0 ? "Perlu follow-up" : "Tidak ada macet",
    aiInsight: aiInsight
      ? new Date(aiInsight.generatedAt).toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short"
        })
      : "Belum ada analisa — buka AI Direktur"
  };
}

/** Sumber data dashboard Owner — finance, forms, inventory, POS, task, AI. */
export async function getDashboardData(): Promise<DashboardData> {
  const today = todayIso();
  const finance = getFinanceSummary();
  const report = buildDailyReport();
  const aiInsight = loadAiInsightPreview();

  const [stokKritis, posSales, taskSummary] = await Promise.all([
    loadStokKritisCount(today),
    getPosSalesToday(today),
    fetchTaskOverdueCount()
  ]);

  const taskHint =
    taskSummary.source === "api"
      ? taskSummary.message
      : taskSummary.source === "error"
        ? taskSummary.message
        : "Set TASK_DASHBOARD_API_URL di Task Dashboard";

  const posSource = posSales.source === "supabase" ? "Dari POS cloud" : "Dari POS (in-memory)";

  const ringkasan: RingkasanHariIni = {
    kasTersedia: finance.kasTersedia,
    freeCash: finance.freeCash,
    kasMasukHariIni: finance.kasMasukHariIni,
    kasKeluarHariIni: finance.kasKeluarHariIni,
    kasTertahan: finance.kasTertahan,
    utangJatuhTempo: finance.utangJatuhTempo,
    requestBahanPending: report.totals.requestBahanPending,
    requestMacet: report.totals.stuckCount,
    stokKritis,
    taskTelat: taskSummary.overdueCount,
    approvalMenunggu: report.totals.pendingApprovals,
    posSalesHariIni: posSales.total,
    posOrderCountHariIni: posSales.orderCount
  };

  return {
    ringkasan,
    hints: buildHints(ringkasan, taskHint, posSource, aiInsight),
    today,
    aiInsight
  };
}
