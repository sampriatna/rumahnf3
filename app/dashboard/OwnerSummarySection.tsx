import { TASK_DASHBOARD_URL } from "@/lib/constants";
import { formatRupiah } from "@/lib/format-rupiah";
import { getDashboardData } from "@/lib/dashboard-source";
import { METRIC_HINTS } from "@/lib/metric-hints";
import { DashboardOwnerSummary, type OwnerWidget } from "@/components/DashboardOwnerSummary";

export async function OwnerSummarySection() {
  const dashboard = await getDashboardData();

  const widgets: OwnerWidget[] = [
    {
      label: "Kas Tersedia",
      value: formatRupiah(dashboard.ringkasan.kasTersedia),
      hint: dashboard.hints.kasTersedia
    },
    {
      label: "Free Cash",
      value: formatRupiah(dashboard.ringkasan.freeCash),
      hint: dashboard.hints.freeCash
    },
    {
      label: "Kas Masuk Hari Ini",
      value: formatRupiah(dashboard.ringkasan.kasMasukHariIni),
      hint: dashboard.hints.kasMasukHariIni
    },
    {
      label: "Kas Keluar Hari Ini",
      value: formatRupiah(dashboard.ringkasan.kasKeluarHariIni),
      hint: dashboard.hints.kasKeluarHariIni
    },
    {
      label: "Penjualan POS",
      value: formatRupiah(dashboard.ringkasan.posSalesHariIni),
      hint: dashboard.hints.posSalesHariIni
    },
    {
      label: "Task Telat",
      value: dashboard.ringkasan.taskTelat != null ? String(dashboard.ringkasan.taskTelat) : "0",
      hint: dashboard.hints.taskTelat,
      href: TASK_DASHBOARD_URL
    },
    {
      label: "Request Bahan Pending",
      value: String(dashboard.ringkasan.requestBahanPending),
      hint: dashboard.hints.requestBahanPending
    },
    {
      label: "Stok Kritis",
      value: String(dashboard.ringkasan.stokKritis),
      hint: dashboard.hints.stokKritis,
      href: "/inventory"
    },
    {
      label: "Approval Menunggu",
      value: String(dashboard.ringkasan.approvalMenunggu),
      hint: dashboard.hints.approvalMenunggu,
      href: "/approvals"
    },
    {
      label: "Request Macet",
      value: String(dashboard.ringkasan.requestMacet),
      hint: dashboard.hints.requestMacet,
      metricHint: METRIC_HINTS.requestMacet,
      href: "/inbox?grup=macet"
    },
    {
      label: "AI Insight",
      value: dashboard.aiInsight ? "Analisa tersedia" : "—",
      hint: dashboard.aiInsight?.preview ?? dashboard.hints.aiInsight,
      href: "/ai",
      footerLink: dashboard.aiInsight ? "Baca analisa lengkap →" : undefined
    }
  ];

  return <DashboardOwnerSummary widgets={widgets} />;
}
