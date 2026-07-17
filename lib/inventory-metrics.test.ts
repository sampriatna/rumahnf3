import { describe, it, expect } from "vitest";
import {
  saldoLokasi,
  saldoTotal,
  statusStok,
  stokKritisList,
  nilaiStokPerLokasi,
  anomaliStok,
  countTransferHariIni,
  buildSaldoMap,
  countStatusStok,
  totalNilaiStok,
  stokKritisByPrioritas
} from "./inventory-metrics";
import type {
  MasterBahan,
  MasterLokasi,
  BarangMasuk,
  TransferStok,
  PemakaianOutlet,
  WasteSelisih,
  OpnameAwal
} from "@/types/inventory";

const TODAY = "2026-06-13";

const lokasi: MasterLokasi[] = [
  { kode: "GDG", namaLokasi: "Gudang", jenis: "Gudang" },
  { kode: "KBU", namaLokasi: "KBU", jenis: "Outlet" }
];

const bahanAyam: MasterBahan = {
  kodeBahan: "BH-Ayam",
  namaBaku: "Ayam",
  kategori: "Protein",
  satuanBeli: "kg",
  satuanPakai: "kg",
  konversi: 1,
  hargaPerSatuanPakai: 40_000,
  supplierUtama: "X",
  stokMinimum: 8,
  stokAman: 15,
  stokMaksimum: 40,
  statusAktif: "Aktif",
  metodeStok: "Distok"
};

describe("saldoLokasi", () => {
  it("menghitung opname + masuk + transfer − pemakaian − waste", () => {
    const opname: OpnameAwal[] = [{ tanggal: "2026-06-01", kodeBahan: "BH-Ayam", lokasi: "KBU", qtyAwal: 5 }];
    const masuk: BarangMasuk[] = [];
    const transfer: TransferStok[] = [
      {
        tanggal: TODAY,
        kodeBahan: "BH-Ayam",
        qty: 10,
        dariLokasi: "GDG",
        keLokasi: "KBU",
        dikeluarkanOleh: "A",
        diterimaOleh: "B"
      }
    ];
    const pemakaian: PemakaianOutlet[] = [
      {
        tanggal: TODAY,
        kodeBahan: "BH-Ayam",
        qty: 12,
        lokasi: "KBU",
        jenisPemakaian: "Menu",
        pic: "POS"
      }
    ];
    expect(saldoLokasi("BH-Ayam", "KBU", opname, masuk, transfer, pemakaian, [])).toBe(3);
  });
});

describe("statusStok", () => {
  it("mengembalikan BELI, WASPADA, AMAN", () => {
    expect(statusStok(5, bahanAyam)).toBe("BELI");
    expect(statusStok(12, bahanAyam)).toBe("WASPADA");
    expect(statusStok(20, bahanAyam)).toBe("AMAN");
  });
});

describe("stokKritisList", () => {
  it("exclude BeliHarian dan Nonaktif", () => {
    const bahan: MasterBahan[] = [
      bahanAyam,
      {
        ...bahanAyam,
        kodeBahan: "BH-Sayur",
        namaBaku: "Sayur",
        metodeStok: "BeliHarian",
        stokMinimum: 100
      },
      {
        ...bahanAyam,
        kodeBahan: "BH-Gula",
        namaBaku: "Gula",
        statusAktif: "Nonaktif"
      }
    ];
    const bundle = {
      opname: [{ tanggal: "2026-06-01", kodeBahan: "BH-Ayam", lokasi: "KBU", qtyAwal: 1 }],
      masuk: [],
      transfer: [],
      pemakaian: [],
      waste: []
    };
    const list = stokKritisList(bahan, lokasi, bundle);
    expect(list.every((x) => x.kodeBahan === "BH-Ayam")).toBe(true);
    expect(list.find((x) => x.kodeBahan === "BH-Sayur")).toBeUndefined();
  });
});

describe("anomaliStok", () => {
  it("mendeteksi saldo negatif", () => {
    const bahan = [bahanAyam];
    const bundle = {
      opname: [{ tanggal: "2026-06-01", kodeBahan: "BH-Ayam", lokasi: "KBU", qtyAwal: 1 }],
      masuk: [],
      transfer: [],
      pemakaian: [
        {
          tanggal: TODAY,
          kodeBahan: "BH-Ayam",
          qty: 5,
          lokasi: "KBU",
          jenisPemakaian: "Menu",
          pic: "X"
        }
      ],
      waste: []
    };
    const a = anomaliStok(bahan, lokasi, bundle);
    expect(a.length).toBe(1);
    expect(a[0].saldo).toBeLessThan(0);
  });
});

describe("nilaiStokPerLokasi", () => {
  it("menghitung nilai rupiah", () => {
    const bahan = [bahanAyam];
    const bundle = {
      opname: [{ tanggal: "2026-06-01", kodeBahan: "BH-Ayam", lokasi: "KBU", qtyAwal: 10 }],
      masuk: [],
      transfer: [],
      pemakaian: [],
      waste: []
    };
    expect(nilaiStokPerLokasi("KBU", bahan, lokasi, bundle)).toBe(400_000);
  });
});

describe("buildSaldoMap", () => {
  it("mengembalikan saldo per lokasi + total per bahan", () => {
    const bundle = {
      opname: [
        { tanggal: "2026-06-01", kodeBahan: "BH-Ayam", lokasi: "GDG", qtyAwal: 40 },
        { tanggal: "2026-06-01", kodeBahan: "BH-Ayam", lokasi: "KBU", qtyAwal: 5 }
      ],
      masuk: [],
      transfer: [
        {
          tanggal: TODAY,
          kodeBahan: "BH-Ayam",
          qty: 10,
          dariLokasi: "GDG",
          keLokasi: "KBU",
          dikeluarkanOleh: "A",
          diterimaOleh: "B"
        }
      ],
      pemakaian: [
        {
          tanggal: TODAY,
          kodeBahan: "BH-Ayam",
          qty: 12,
          lokasi: "KBU",
          jenisPemakaian: "Menu",
          pic: "POS"
        }
      ],
      waste: []
    };
    const map = buildSaldoMap([bahanAyam], lokasi, bundle);
    expect(map["BH-Ayam"].GDG).toBe(30);
    expect(map["BH-Ayam"].KBU).toBe(3);
    expect(map["BH-Ayam"].total).toBe(33);
  });
});

describe("countStatusStok", () => {
  it("menghitung jumlah BELI, WASPADA, AMAN", () => {
    const bundle = {
      opname: [{ tanggal: "2026-06-01", kodeBahan: "BH-Ayam", lokasi: "KBU", qtyAwal: 5 }],
      masuk: [],
      transfer: [],
      pemakaian: [],
      waste: []
    };
    expect(countStatusStok([bahanAyam], lokasi, bundle)).toEqual({
      beli: 1,
      waspada: 0,
      aman: 0
    });
  });
});

describe("totalNilaiStok", () => {
  it("menjumlahkan saldo × harga", () => {
    const bundle = {
      opname: [{ tanggal: "2026-06-01", kodeBahan: "BH-Ayam", lokasi: "KBU", qtyAwal: 10 }],
      masuk: [],
      transfer: [],
      pemakaian: [],
      waste: []
    };
    expect(totalNilaiStok([bahanAyam], lokasi, bundle)).toBe(400_000);
  });
});

describe("stokKritisByPrioritas", () => {
  it("hanya BELI/WASPADA dan urut prioritas nilai", () => {
    const bundle = {
      opname: [{ tanggal: "2026-06-01", kodeBahan: "BH-Ayam", lokasi: "KBU", qtyAwal: 5 }],
      masuk: [],
      transfer: [],
      pemakaian: [],
      waste: []
    };
    const rows = stokKritisByPrioritas([bahanAyam], lokasi, bundle);
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("BELI");
  });
});

describe("countTransferHariIni", () => {
  it("menghitung transfer pada tanggal today", () => {
    const rows: TransferStok[] = [
      {
        tanggal: `${TODAY}T09:00:00Z`,
        kodeBahan: "BH-Ayam",
        qty: 1,
        dariLokasi: "GDG",
        keLokasi: "KBU",
        dikeluarkanOleh: "A",
        diterimaOleh: "B"
      },
      {
        tanggal: "2026-06-12T09:00:00Z",
        kodeBahan: "BH-Ayam",
        qty: 1,
        dariLokasi: "GDG",
        keLokasi: "KBU",
        dikeluarkanOleh: "A",
        diterimaOleh: "B"
      }
    ];
    expect(countTransferHariIni(rows, TODAY)).toBe(1);
  });
});
