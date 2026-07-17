import type {
  MasterOutlet,
  MasterAkun,
  UangMasuk,
  Pengeluaran,
  PriveOwner,
  TransferAntarAkun,
  Piutang,
  Hutang,
  KasHarianFNB
} from "@/types/finance";
import { todayIso } from "@/lib/date-format";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

const TODAY = todayIso();
const YESTERDAY = isoDaysAgo(1);

/** Data dummy terpusat — struktur sama Google Sheets, siap diganti Sheets/Supabase. */
export const DUMMY_MASTER_OUTLET: MasterOutlet[] = [
  { id: "out-kbu", kode: "KBU", namaOutlet: "Kopi Bunder Utara", status: "Aktif" },
  { id: "out-kis", kode: "KIS", namaOutlet: "Kisamen", status: "Aktif" },
  { id: "out-sam", kode: "SAM", namaOutlet: "Samtaro", status: "Aktif" }
];

export const DUMMY_MASTER_AKUN: MasterAkun[] = [
  {
    id: "akn-cash-kbu",
    kodeAkun: "CASH-KBU",
    namaAkun: "Cash Fisik KBU",
    tipeAkun: "Cash",
    outlet: "KBU",
    saldoAwal: 5_000_000,
    status: "Aktif"
  },
  {
    id: "akn-bank-nf3",
    kodeAkun: "BANK-NF3",
    namaAkun: "Rekening Operasional NF3",
    tipeAkun: "Bank",
    outlet: "NF3",
    saldoAwal: 120_000_000,
    status: "Aktif"
  },
  {
    id: "akn-qris-kbu",
    kodeAkun: "QRIS-KBU",
    namaAkun: "QRIS KBU",
    tipeAkun: "QRIS",
    outlet: "KBU",
    saldoAwal: 0,
    status: "Aktif"
  },
  {
    id: "akn-mkt-kbu",
    kodeAkun: "MKT-KBU",
    namaAkun: "GoFood/Grab KBU",
    tipeAkun: "Marketplace",
    outlet: "KBU",
    saldoAwal: 0,
    status: "Aktif"
  },
  {
    id: "akn-cash-kis",
    kodeAkun: "CASH-KIS",
    namaAkun: "Cash Fisik Kisamen",
    tipeAkun: "Cash",
    outlet: "KIS",
    saldoAwal: 3_000_000,
    status: "Aktif"
  },
  {
    id: "akn-owner",
    kodeAkun: "OWNER-WALLET",
    namaAkun: "Dompet Owner",
    tipeAkun: "Owner",
    outlet: "NF3",
    saldoAwal: 15_000_000,
    status: "Nonaktif"
  }
];

export const DUMMY_UANG_MASUK: UangMasuk[] = [
  {
    id: "um-1",
    tanggal: `${TODAY}T08:00:00.000Z`,
    outlet: "KBU",
    jenisUangMasuk: "Setoran Kasir",
    sumber: "Shift pagi",
    akunTujuan: "CASH-KBU",
    gross: 4_500_000,
    fee: 0,
    net: 4_500_000,
    statusCair: "Cair",
    tanggalCair: TODAY,
    pic: "Kasir A"
  },
  {
    id: "um-2",
    tanggal: `${TODAY}T10:30:00.000Z`,
    outlet: "KBU",
    jenisUangMasuk: "QRIS",
    sumber: "Penjualan QRIS",
    akunTujuan: "QRIS-KBU",
    gross: 1_200_000,
    fee: 12_000,
    net: 1_188_000,
    statusCair: "Cair",
    tanggalCair: TODAY,
    pic: "Sistem"
  },
  {
    id: "um-3",
    tanggal: `${TODAY}T11:00:00.000Z`,
    outlet: "KBU",
    jenisUangMasuk: "GoFood",
    sumber: "GoFood",
    akunTujuan: "MKT-KBU",
    gross: 850_000,
    fee: 127_500,
    net: 722_500,
    statusCair: "Pending",
    pic: "Sistem"
  },
  {
    id: "um-4",
    tanggal: `${YESTERDAY}T18:00:00.000Z`,
    outlet: "KIS",
    jenisUangMasuk: "Setoran Kasir",
    sumber: "Shift sore",
    akunTujuan: "CASH-KIS",
    gross: 2_100_000,
    fee: 0,
    net: 2_100_000,
    statusCair: "Cair",
    tanggalCair: YESTERDAY,
    pic: "Kasir B"
  }
];

export const DUMMY_PENGELUARAN: Pengeluaran[] = [
  {
    id: "pg-1",
    tanggal: `${TODAY}T09:00:00.000Z`,
    outlet: "KBU",
    kategori: "Bahan Baku",
    namaPengeluaran: "Beli ayam paha",
    akunSumber: "CASH-KBU",
    nominal: 750_000,
    metodeBayar: "Cash",
    pic: "Leader KBU"
  },
  {
    id: "pg-2",
    tanggal: `${TODAY}T14:00:00.000Z`,
    outlet: "KBU",
    kategori: "Operasional",
    namaPengeluaran: "Gas LPG",
    akunSumber: "CASH-KBU",
    nominal: 320_000,
    metodeBayar: "Cash",
    pic: "Leader KBU"
  },
  {
    id: "pg-3",
    tanggal: `${YESTERDAY}T16:00:00.000Z`,
    outlet: "NF3",
    kategori: "Utilitas",
    namaPengeluaran: "Listrik PLN",
    akunSumber: "BANK-NF3",
    nominal: 2_200_000,
    metodeBayar: "Transfer",
    pic: "Admin"
  }
];

export const DUMMY_PRIVE: PriveOwner[] = [
  {
    id: "pr-1",
    tanggal: `${YESTERDAY}T20:00:00.000Z`,
    outlet: "NF3",
    akunSumber: "BANK-NF3",
    nominal: 5_000_000,
    keperluan: "Kebutuhan pribadi owner"
  }
];

export const DUMMY_TRANSFER: TransferAntarAkun[] = [
  {
    id: "tr-1",
    tanggal: `${TODAY}T17:00:00.000Z`,
    dariAkun: "CASH-KBU",
    keAkun: "BANK-NF3",
    nominal: 3_000_000,
    fee: 6_500
  }
];

export const DUMMY_PIUTANG: Piutang[] = [
  {
    id: "pi-1",
    tanggal: isoDaysAgo(10),
    outlet: "KBU",
    debitur: "Catering ABC",
    kategoriPiutang: "Catering",
    nominal: 8_500_000,
    terbayar: 0,
    sisa: 8_500_000,
    jatuhTempo: isoDaysAgo(-14),
    status: "Belum Lunas"
  }
];

export const DUMMY_HUTANG: Hutang[] = [
  {
    id: "hu-1",
    tanggal: isoDaysAgo(20),
    outlet: "NF3",
    kreditor: "Supplier Ayam Jaya",
    kategoriPiutang: "Supplier",
    nominal: 4_500_000,
    terbayar: 1_000_000,
    sisa: 3_500_000,
    jatuhTempo: isoDaysAgo(-3),
    status: "Belum Lunas"
  },
  {
    id: "hu-2",
    tanggal: isoDaysAgo(5),
    outlet: "KBU",
    kreditor: "PLN",
    kategoriPiutang: "Utilitas",
    nominal: 2_200_000,
    terbayar: 0,
    sisa: 2_200_000,
    jatuhTempo: isoDaysAgo(-10),
    status: "Belum Lunas"
  }
];

export const DUMMY_KAS_HARIAN: KasHarianFNB[] = [
  {
    id: "kh-1",
    tanggal: TODAY,
    outlet: "KBU",
    kasAwal: 500_000,
    kasAkhirFisik: 1_180_000,
    pengeluaranCash: 1_070_000,
    penjualanCashManual: 4_500_000,
    cashSeharusnya: 3_930_000,
    selisihKas: -2_750_000,
    cashSetorOwner: 3_000_000,
    cashStandbyBesok: 500_000,
    status: "Closing"
  },
  {
    id: "kh-2",
    tanggal: TODAY,
    outlet: "KIS",
    kasAwal: 300_000,
    kasAkhirFisik: 0,
    pengeluaranCash: 0,
    penjualanCashManual: 0,
    cashSeharusnya: 300_000,
    selisihKas: 0,
    cashSetorOwner: 0,
    cashStandbyBesok: 0,
    status: "Open"
  }
];
