import type {
  MasterAkun,
  UangMasuk,
  Pengeluaran,
  PriveOwner,
  TransferAntarAkun,
  Hutang,
  KasHarianFNB
} from "@/types/finance";
import { isSameIsoDay } from "./date-format";

/** Saldo akun = saldoAwal + net masuk − pengeluaran − prive + transfer masuk − (transfer keluar + fee). */
export function saldoAkun(
  akun: MasterAkun,
  uangMasuk: UangMasuk[],
  pengeluaran: Pengeluaran[],
  prive: PriveOwner[],
  transfer: TransferAntarAkun[]
): number {
  const key = akun.kodeAkun;
  let saldo = akun.saldoAwal;

  for (const um of uangMasuk) {
    if (um.akunTujuan === key) saldo += um.net;
  }
  for (const p of pengeluaran) {
    if (p.akunSumber === key) saldo -= p.nominal;
  }
  for (const pr of prive) {
    if (pr.akunSumber === key) saldo -= pr.nominal;
  }
  for (const t of transfer) {
    if (t.keAkun === key) saldo += t.nominal;
    if (t.dariAkun === key) saldo -= t.nominal + t.fee;
  }

  return saldo;
}

/** Σ saldo semua akun berstatus Aktif. */
export function kasTersedia(
  akunList: MasterAkun[],
  uangMasuk: UangMasuk[],
  pengeluaran: Pengeluaran[],
  prive: PriveOwner[],
  transfer: TransferAntarAkun[]
): number {
  return akunList
    .filter((a) => a.status === "Aktif")
    .reduce(
      (sum, a) => sum + saldoAkun(a, uangMasuk, pengeluaran, prive, transfer),
      0
    );
}

/** Σ net uang masuk dengan tanggal == today (ISO YYYY-MM-DD). */
export function kasMasukHariIni(uangMasuk: UangMasuk[], today: string): number {
  return uangMasuk
    .filter((um) => isSameIsoDay(um.tanggal, today))
    .reduce((s, um) => s + um.net, 0);
}

/** Σ net uang masuk yang belum cair (statusCair != "Cair"). */
export function marketplaceBelumCair(uangMasuk: UangMasuk[]): number {
  return uangMasuk
    .filter((um) => um.statusCair !== "Cair")
    .reduce((s, um) => s + um.net, 0);
}

/** Σ sisa hutang dengan jatuhTempo <= today + dalamHari. */
export function hutangJatuhTempo(hutang: Hutang[], dalamHari: number, today: string): number {
  const limit = new Date(`${today}T23:59:59.999Z`).getTime() + dalamHari * 86_400_000;
  return hutang
    .filter((h) => h.sisa > 0 && new Date(h.jatuhTempo).getTime() <= limit)
    .reduce((s, h) => s + h.sisa, 0);
}

const CLOSING_STATUSES = new Set(["Closing", "Closed", "Selesai", "closing"]);

/** Σ selisihKas outlet yang sudah closing pada hari today. */
export function selisihKasHariIni(kasHarian: KasHarianFNB[], today: string): number {
  return kasHarian
    .filter(
      (k) => isSameIsoDay(k.tanggal, today) && CLOSING_STATUSES.has(k.status)
    )
    .reduce((s, k) => s + k.selisihKas, 0);
}

export type FinanceMetrics = {
  kasTersedia: number;
  kasMasukHariIni: number;
  marketplaceBelumCair: number;
  hutangJatuhTempo7Hari: number;
  selisihKasHariIni: number;
};

/** Hitung semua metrik keuangan dari snapshot data (pure). */
export function computeFinanceMetrics(
  akun: MasterAkun[],
  uangMasuk: UangMasuk[],
  pengeluaran: Pengeluaran[],
  prive: PriveOwner[],
  transfer: TransferAntarAkun[],
  hutang: Hutang[],
  kasHarian: KasHarianFNB[],
  today: string
): FinanceMetrics {
  return {
    kasTersedia: kasTersedia(akun, uangMasuk, pengeluaran, prive, transfer),
    kasMasukHariIni: kasMasukHariIni(uangMasuk, today),
    marketplaceBelumCair: marketplaceBelumCair(uangMasuk),
    hutangJatuhTempo7Hari: hutangJatuhTempo(hutang, 7, today),
    selisihKasHariIni: selisihKasHariIni(kasHarian, today)
  };
}
