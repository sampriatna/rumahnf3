/** Tipe keuangan — pemetaan 1:1 dari Google Sheets (camelCase). */

export type TipeAkun = "Cash" | "Bank" | "QRIS" | "EDC" | "Marketplace" | "Owner";

export type MasterOutlet = {
  id: string;
  kode: string;
  namaOutlet: string;
  status: string;
};

export type MasterAkun = {
  id: string;
  kodeAkun: string;
  namaAkun: string;
  tipeAkun: TipeAkun;
  outlet: string;
  saldoAwal: number;
  status: string;
};

export type UangMasuk = {
  id: string;
  tanggal: string;
  outlet: string;
  jenisUangMasuk: string;
  sumber: string;
  akunTujuan: string;
  gross: number;
  fee: number;
  net: number;
  statusCair: string;
  tanggalCair?: string;
  pic: string;
};

export type Pengeluaran = {
  id: string;
  tanggal: string;
  outlet: string;
  kategori: string;
  namaPengeluaran: string;
  akunSumber: string;
  nominal: number;
  metodeBayar: string;
  pic: string;
};

export type PriveOwner = {
  id: string;
  tanggal: string;
  outlet: string;
  akunSumber: string;
  nominal: number;
  keperluan: string;
};

export type TransferAntarAkun = {
  id: string;
  tanggal: string;
  dariAkun: string;
  keAkun: string;
  nominal: number;
  fee: number;
};

export type Piutang = {
  id: string;
  tanggal: string;
  outlet: string;
  debitur: string;
  kategoriPiutang: string;
  nominal: number;
  terbayar: number;
  sisa: number;
  jatuhTempo: string;
  status: string;
};

export type Hutang = {
  id: string;
  tanggal: string;
  outlet: string;
  kreditor: string;
  kategoriPiutang: string;
  nominal: number;
  terbayar: number;
  sisa: number;
  jatuhTempo: string;
  status: string;
};

export type KasHarianFNB = {
  id: string;
  tanggal: string;
  outlet: string;
  kasAwal: number;
  kasAkhirFisik: number;
  pengeluaranCash: number;
  penjualanCashManual: number;
  cashSeharusnya: number;
  selisihKas: number;
  cashSetorOwner: number;
  cashStandbyBesok: number;
  status: string;
};
