import { describe, it, expect } from "vitest";
import {
  saldoAkun,
  kasTersedia,
  kasMasukHariIni,
  marketplaceBelumCair,
  hutangJatuhTempo,
  selisihKasHariIni
} from "./metrics";
import type {
  MasterAkun,
  UangMasuk,
  Pengeluaran,
  PriveOwner,
  TransferAntarAkun,
  Hutang,
  KasHarianFNB
} from "@/types/finance";

const TODAY = "2026-06-13";

const akunCash: MasterAkun = {
  id: "1",
  kodeAkun: "CASH-KBU",
  namaAkun: "Cash KBU",
  tipeAkun: "Cash",
  outlet: "KBU",
  saldoAwal: 1_000_000,
  status: "Aktif"
};

const akunNonaktif: MasterAkun = {
  ...akunCash,
  id: "2",
  kodeAkun: "OWNER-WALLET",
  status: "Nonaktif"
};

describe("saldoAkun", () => {
  it("menghitung saldo dari saldoAwal + transaksi", () => {
    const uangMasuk: UangMasuk[] = [
      {
        id: "um1",
        tanggal: `${TODAY}T08:00:00Z`,
        outlet: "KBU",
        jenisUangMasuk: "Setoran",
        sumber: "Kasir",
        akunTujuan: "CASH-KBU",
        gross: 500_000,
        fee: 0,
        net: 500_000,
        statusCair: "Cair",
        pic: "A"
      }
    ];
    const pengeluaran: Pengeluaran[] = [
      {
        id: "pg1",
        tanggal: `${TODAY}T09:00:00Z`,
        outlet: "KBU",
        kategori: "Bahan",
        namaPengeluaran: "Ayam",
        akunSumber: "CASH-KBU",
        nominal: 200_000,
        metodeBayar: "Cash",
        pic: "L"
      }
    ];
    const transfer: TransferAntarAkun[] = [
      {
        id: "tr1",
        tanggal: `${TODAY}T17:00:00Z`,
        dariAkun: "CASH-KBU",
        keAkun: "BANK-NF3",
        nominal: 100_000,
        fee: 5_000
      }
    ];
    // 1_000_000 + 500_000 - 200_000 - (100_000 + 5_000) = 1_195_000
    expect(saldoAkun(akunCash, uangMasuk, pengeluaran, [], transfer)).toBe(1_195_000);
  });
});

describe("kasTersedia", () => {
  it("hanya menjumlahkan akun Aktif", () => {
    const akunBank: MasterAkun = {
      ...akunCash,
      id: "3",
      kodeAkun: "BANK-NF3",
      tipeAkun: "Bank",
      saldoAwal: 10_000_000
    };
    expect(kasTersedia([akunCash, akunNonaktif, akunBank], [], [], [], [])).toBe(11_000_000);
  });
});

describe("kasMasukHariIni", () => {
  it("menjumlahkan net uang masuk hari ini saja", () => {
    const rows: UangMasuk[] = [
      {
        id: "a",
        tanggal: `${TODAY}T10:00:00Z`,
        outlet: "KBU",
        jenisUangMasuk: "QRIS",
        sumber: "QRIS",
        akunTujuan: "QRIS-KBU",
        gross: 100_000,
        fee: 1_000,
        net: 99_000,
        statusCair: "Cair",
        pic: "S"
      },
      {
        id: "b",
        tanggal: "2026-06-12T10:00:00Z",
        outlet: "KBU",
        jenisUangMasuk: "Cash",
        sumber: "Kasir",
        akunTujuan: "CASH-KBU",
        gross: 50_000,
        fee: 0,
        net: 50_000,
        statusCair: "Cair",
        pic: "S"
      }
    ];
    expect(kasMasukHariIni(rows, TODAY)).toBe(99_000);
  });
});

describe("marketplaceBelumCair", () => {
  it("menjumlahkan net dengan statusCair bukan Cair", () => {
    const rows: UangMasuk[] = [
      {
        id: "a",
        tanggal: `${TODAY}T11:00:00Z`,
        outlet: "KBU",
        jenisUangMasuk: "GoFood",
        sumber: "GoFood",
        akunTujuan: "MKT-KBU",
        gross: 500_000,
        fee: 75_000,
        net: 425_000,
        statusCair: "Pending",
        pic: "S"
      },
      {
        id: "b",
        tanggal: `${TODAY}T12:00:00Z`,
        outlet: "KBU",
        jenisUangMasuk: "Cash",
        sumber: "Kasir",
        akunTujuan: "CASH-KBU",
        gross: 100_000,
        fee: 0,
        net: 100_000,
        statusCair: "Cair",
        pic: "S"
      }
    ];
    expect(marketplaceBelumCair(rows)).toBe(425_000);
  });
});

describe("hutangJatuhTempo", () => {
  it("menjumlahkan sisa hutang jatuh tempo dalam N hari", () => {
    const hutang: Hutang[] = [
      {
        id: "h1",
        tanggal: "2026-06-01",
        outlet: "KBU",
        kreditor: "Supplier",
        kategoriPiutang: "Supplier",
        nominal: 3_000_000,
        terbayar: 0,
        sisa: 3_000_000,
        jatuhTempo: "2026-06-15",
        status: "Belum Lunas"
      },
      {
        id: "h2",
        tanggal: "2026-06-01",
        outlet: "KBU",
        kreditor: "PLN",
        kategoriPiutang: "Utilitas",
        nominal: 1_000_000,
        terbayar: 0,
        sisa: 1_000_000,
        jatuhTempo: "2026-07-01",
        status: "Belum Lunas"
      }
    ];
    expect(hutangJatuhTempo(hutang, 7, TODAY)).toBe(3_000_000);
  });
});

describe("selisihKasHariIni", () => {
  it("menjumlahkan selisih kas outlet yang sudah closing hari ini", () => {
    const kas: KasHarianFNB[] = [
      {
        id: "k1",
        tanggal: TODAY,
        outlet: "KBU",
        kasAwal: 500_000,
        kasAkhirFisik: 1_000_000,
        pengeluaranCash: 500_000,
        penjualanCashManual: 2_000_000,
        cashSeharusnya: 2_000_000,
        selisihKas: -50_000,
        cashSetorOwner: 1_500_000,
        cashStandbyBesok: 500_000,
        status: "Closing"
      },
      {
        id: "k2",
        tanggal: TODAY,
        outlet: "KIS",
        kasAwal: 300_000,
        kasAkhirFisik: 300_000,
        pengeluaranCash: 0,
        penjualanCashManual: 0,
        cashSeharusnya: 300_000,
        selisihKas: 0,
        cashSetorOwner: 0,
        cashStandbyBesok: 0,
        status: "Open"
      }
    ];
    expect(selisihKasHariIni(kas, TODAY)).toBe(-50_000);
  });
});
