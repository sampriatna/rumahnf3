import type {
  MasterLokasi,
  MasterBahan,
  BarangMasuk,
  TransferStok,
  PemakaianOutlet,
  WasteSelisih,
  OpnameAwal
} from "@/types/inventory";
import { todayIso } from "@/lib/date-format";

const TODAY = todayIso();

/** Contoh kecil — mencakup AMAN, WASPADA, BELI, anomali, BeliHarian, Nonaktif. */
export const DUMMY_MASTER_LOKASI: MasterLokasi[] = [
  { kode: "GDG", namaLokasi: "Gudang Pusat", jenis: "Gudang" },
  { kode: "KBU", namaLokasi: "Kopi Bunder Utara", jenis: "Outlet F&B" },
  { kode: "KSM", namaLokasi: "Kisamen", jenis: "Outlet F&B" },
  { kode: "SMT", namaLokasi: "Samtaro", jenis: "Outlet F&B" }
];

export const DUMMY_MASTER_BAHAN: MasterBahan[] = [
  {
    kodeBahan: "BH-AyamPaha",
    namaBaku: "Ayam Paha Fillet",
    kategori: "Protein",
    satuanBeli: "kg",
    satuanPakai: "kg",
    konversi: 1,
    hargaPerSatuanPakai: 42_000,
    supplierUtama: "Supplier Ayam Jaya",
    stokMinimum: 8,
    stokAman: 15,
    stokMaksimum: 40,
    statusAktif: "Aktif",
    metodeStok: "Distok"
  },
  {
    kodeBahan: "BH-SusuUHT",
    namaBaku: "Susu UHT 1L",
    kategori: "Dairy",
    satuanBeli: "liter",
    satuanPakai: "ml",
    konversi: 1000,
    hargaPerSatuanPakai: 18,
    supplierUtama: "Distributor Susu",
    stokMinimum: 50_000,
    stokAman: 80_000,
    stokMaksimum: 200_000,
    statusAktif: "Aktif",
    metodeStok: "Distok"
  },
  {
    kodeBahan: "BH-KopiBubuk",
    namaBaku: "Kopi Bubuk Blend",
    kategori: "Kopi",
    satuanBeli: "kg",
    satuanPakai: "g",
    konversi: 1000,
    hargaPerSatuanPakai: 120,
    supplierUtama: "Roastery NF3",
    stokMinimum: 5_000,
    stokAman: 10_000,
    stokMaksimum: 30_000,
    statusAktif: "Aktif",
    metodeStok: "Distok"
  },
  {
    kodeBahan: "BH-Bawang",
    namaBaku: "Bawang Merah",
    kategori: "Bumbu",
    satuanBeli: "kg",
    satuanPakai: "kg",
    konversi: 1,
    hargaPerSatuanPakai: 35_000,
    supplierUtama: "Pasar Induk",
    stokMinimum: 3,
    stokAman: 6,
    stokMaksimum: 20,
    statusAktif: "Aktif",
    metodeStok: "Distok"
  },
  {
    kodeBahan: "BH-SayurBayam",
    namaBaku: "Bayam Segar",
    kategori: "Sayur",
    satuanBeli: "ikat",
    satuanPakai: "ikat",
    konversi: 1,
    hargaPerSatuanPakai: 5_000,
    supplierUtama: "Pasar Harian",
    stokMinimum: 10,
    stokAman: 20,
    stokMaksimum: 50,
    statusAktif: "Aktif",
    metodeStok: "BeliHarian"
  },
  {
    kodeBahan: "BH-Gula",
    namaBaku: "Gula Pasir (discontinued)",
    kategori: "Bumbu",
    satuanBeli: "kg",
    satuanPakai: "g",
    konversi: 1000,
    hargaPerSatuanPakai: 15,
    supplierUtama: "—",
    stokMinimum: 5_000,
    stokAman: 10_000,
    stokMaksimum: 50_000,
    statusAktif: "Nonaktif",
    metodeStok: "Distok"
  }
];

export const DUMMY_OPNAME: OpnameAwal[] = [
  { tanggal: "2026-06-01", kodeBahan: "BH-AyamPaha", lokasi: "GDG", qtyAwal: 3 },
  { tanggal: "2026-06-01", kodeBahan: "BH-AyamPaha", lokasi: "KBU", qtyAwal: 2 },
  { tanggal: "2026-06-01", kodeBahan: "BH-SusuUHT", lokasi: "GDG", qtyAwal: 120_000 },
  { tanggal: "2026-06-01", kodeBahan: "BH-KopiBubuk", lokasi: "GDG", qtyAwal: 25_000 },
  { tanggal: "2026-06-01", kodeBahan: "BH-KopiBubuk", lokasi: "KBU", qtyAwal: 8_000 },
  { tanggal: "2026-06-01", kodeBahan: "BH-Bawang", lokasi: "KBU", qtyAwal: 2 }
];

export const DUMMY_BARANG_MASUK: BarangMasuk[] = [
  {
    id: "bm-1",
    tanggal: `${TODAY}T07:00:00Z`,
    kodeBahan: "BH-AyamPaha",
    qty: 10,
    satuan: "kg",
    totalHarga: 400_000,
    supplier: "Supplier Ayam Jaya",
    lokasiTujuan: "GDG",
    diterimaOleh: "Gudang"
  },
  {
    id: "bm-2",
    tanggal: `${TODAY}T08:30:00Z`,
    kodeBahan: "BH-SusuUHT",
    qty: 20,
    satuan: "liter",
    totalHarga: 360_000,
    supplier: "Distributor Susu",
    lokasiTujuan: "GDG",
    diterimaOleh: "Gudang"
  }
];

export const DUMMY_TRANSFER: TransferStok[] = [
  {
    id: "tr-1",
    tanggal: `${TODAY}T09:00:00Z`,
    kodeBahan: "BH-AyamPaha",
    qty: 12,
    dariLokasi: "GDG",
    keLokasi: "KBU",
    dikeluarkanOleh: "Gudang",
    diterimaOleh: "Leader KBU"
  },
  {
    id: "tr-2",
    tanggal: `${TODAY}T10:00:00Z`,
    kodeBahan: "BH-KopiBubuk",
    qty: 3_000,
    dariLokasi: "GDG",
    keLokasi: "KBU",
    dikeluarkanOleh: "Gudang",
    diterimaOleh: "Bar KBU"
  },
  {
    id: "tr-3",
    tanggal: "2026-06-12T11:00:00Z",
    kodeBahan: "BH-SusuUHT",
    qty: 10_000,
    dariLokasi: "GDG",
    keLokasi: "KSM",
    dikeluarkanOleh: "Gudang",
    diterimaOleh: "Leader KSM"
  }
];

/** Pemakaian = penjualan menu / resep BOM (kurangi stok outlet). */
export const DUMMY_PEMAKAIAN: PemakaianOutlet[] = [
  {
    id: "pk-1",
    tanggal: `${TODAY}T12:00:00Z`,
    kodeBahan: "BH-AyamPaha",
    qty: 14,
    lokasi: "KBU",
    jenisPemakaian: "Penjualan Menu",
    pic: "Sistem POS/BOM"
  },
  {
    id: "pk-2",
    tanggal: `${TODAY}T15:00:00Z`,
    kodeBahan: "BH-KopiBubuk",
    qty: 1_200,
    lokasi: "KBU",
    jenisPemakaian: "Penjualan Menu",
    pic: "Sistem POS/BOM"
  },
  {
    id: "pk-3",
    tanggal: `${TODAY}T16:00:00Z`,
    kodeBahan: "BH-Bawang",
    qty: 5,
    lokasi: "KBU",
    jenisPemakaian: "Penjualan Menu",
    pic: "Dapur"
  }
];

export const DUMMY_WASTE: WasteSelisih[] = [
  {
    id: "ws-1",
    tanggal: `${TODAY}T18:00:00Z`,
    kodeBahan: "BH-SusuUHT",
    lokasi: "GDG",
    jenis: "Kadaluarsa",
    qty: 84_000,
    alasan: "Batch kadaluarsa + botol bocor"
  }
];
