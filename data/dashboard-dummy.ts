import type { RingkasanHariIni } from "@/types/dashboard";

/**
 * Satu-satunya tempat angka dummy dashboard Owner boleh hidup.
 * Angka mengacu seed demo: cash 35jt + bank 120jt + buffer operasional.
 */
export const DASHBOARD_RINGKASAN_DUMMY: RingkasanHariIni = {
  kasTersedia: 155_028_000,
  freeCash: 150_628_000,
  kasMasukHariIni: 4_250_000,
  kasKeluarHariIni: 1_200_000,
  kasTertahan: 8_500_000,
  utangJatuhTempo: 4_400_000,
  requestBahanPending: 2,
  requestMacet: 1,
  stokKritis: 1,
  taskTelat: null,
  approvalMenunggu: 3,
  posSalesHariIni: 12_450_000,
  posOrderCountHariIni: 48
};
