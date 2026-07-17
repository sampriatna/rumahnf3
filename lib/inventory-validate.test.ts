import { describe, it, expect } from "vitest";
import {
  validateBarangMasuk,
  validateTransferStok,
  validatePemakaianOutlet
} from "./inventory-validate";
import type { MasterBahan } from "@/types/inventory";

const bahan: MasterBahan[] = [
  {
    kodeBahan: "BH-A",
    namaBaku: "A",
    kategori: "X",
    satuanBeli: "kg",
    satuanPakai: "kg",
    konversi: 1,
    hargaPerSatuanPakai: 1000,
    supplierUtama: "S",
    stokMinimum: 1,
    stokAman: 5,
    stokMaksimum: 10,
    statusAktif: "Aktif",
    metodeStok: "Distok"
  }
];

describe("validateBarangMasuk", () => {
  it("reject lokasiTujuan kosong", () => {
    const r = validateBarangMasuk(
      {
        tanggal: "2026-06-13",
        kodeBahan: "BH-A",
        qty: 1,
        satuan: "kg",
        totalHarga: 1000,
        supplier: "S",
        lokasiTujuan: "",
        diterimaOleh: "X"
      },
      bahan
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("lokasiTujuan");
  });

  it("reject kodeBahan tidak ada", () => {
    const r = validateBarangMasuk(
      {
        tanggal: "2026-06-13",
        kodeBahan: "BH-UNKNOWN",
        qty: 1,
        satuan: "kg",
        totalHarga: 1000,
        supplier: "S",
        lokasiTujuan: "GDG",
        diterimaOleh: "X"
      },
      bahan
    );
    expect(r.ok).toBe(false);
  });
});

describe("validateTransferStok", () => {
  it("reject dariLokasi == keLokasi", () => {
    const r = validateTransferStok(
      {
        tanggal: "2026-06-13",
        kodeBahan: "BH-A",
        qty: 1,
        dariLokasi: "GDG",
        keLokasi: "GDG",
        dikeluarkanOleh: "A",
        diterimaOleh: "B"
      },
      bahan
    );
    expect(r.ok).toBe(false);
  });
});

describe("validatePemakaianOutlet", () => {
  it("reject qty <= 0", () => {
    const r = validatePemakaianOutlet(
      {
        tanggal: "2026-06-13",
        kodeBahan: "BH-A",
        qty: 0,
        lokasi: "KBU",
        jenisPemakaian: "Menu",
        pic: "X"
      },
      bahan
    );
    expect(r.ok).toBe(false);
  });
});
