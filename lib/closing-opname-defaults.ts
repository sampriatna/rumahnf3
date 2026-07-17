import type { ClosingOpnameRule } from "@/types/inventory";

/** Aturan awal — owner bisa ubah di Settings → Opname Closing. */
export const DEFAULT_CLOSING_OPNAME_RULES: ClosingOpnameRule[] = [
  {
    id: "clr-kbu-ayam",
    outletId: "kbu",
    stationId: "dapur",
    kodeBahan: "BH-AyamPaha",
    label: "Ayam Paha Marinasi",
    wajibOpname: true,
    kategori: "ready-to-sale",
    lokasiStok: "KBU"
  },
  {
    id: "clr-kbu-susu",
    outletId: "kbu",
    stationId: "bar",
    kodeBahan: "BH-SusuUHT",
    label: "Susu UHT (bar/chiller)",
    wajibOpname: true,
    kategori: "ready-to-sale",
    lokasiStok: "KBU"
  },
  {
    id: "clr-kbu-kopi",
    outletId: "kbu",
    stationId: "bar",
    kodeBahan: "BH-KopiBubuk",
    label: "Kopi Bubuk Blend",
    wajibOpname: false,
    kategori: "ready-to-sale",
    lokasiStok: "KBU"
  },
  {
    id: "clr-kbu-bawang",
    outletId: "kbu",
    stationId: "dapur",
    kodeBahan: "BH-Bawang",
    label: "Bawang Iris (prep)",
    wajibOpname: false,
    kategori: "ready-to-sale",
    lokasiStok: "KBU"
  }
];
