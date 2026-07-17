/** Tipe data dashboard Owner — terpisah dari sumber (dummy / Supabase / Sheets). */

export type RingkasanHariIni = {
  kasTersedia: number | null;
  freeCash: number | null;
  kasMasukHariIni: number | null;
  kasKeluarHariIni: number | null;
  kasTertahan: number | null;
  utangJatuhTempo: number | null;
  requestBahanPending: number;
  requestMacet: number;
  stokKritis: number;
  taskTelat: number | null;
  approvalMenunggu: number;
  posSalesHariIni: number | null;
  posOrderCountHariIni: number;
};

export type DashboardAiInsight = {
  preview: string;
  generatedAt: string;
};

export type DashboardWidgetHints = {
  kasTersedia: string;
  freeCash: string;
  kasMasukHariIni: string;
  kasKeluarHariIni: string;
  requestBahanPending: string;
  stokKritis: string;
  taskTelat: string;
  approvalMenunggu: string;
  posSalesHariIni: string;
  requestMacet: string;
  aiInsight: string;
};

export type DashboardData = {
  ringkasan: RingkasanHariIni;
  hints: DashboardWidgetHints;
  /** Tanggal ringkasan (YYYY-MM-DD) — untuk hint tampilan. */
  today: string;
  aiInsight: DashboardAiInsight | null;
};
