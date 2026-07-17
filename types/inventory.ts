/** Tipe inventory — pemetaan 1:1 dari Google Sheets (camelCase). */

export type KodeLokasi = "GDG" | "KBU" | "KSM" | "SMT";

export type MetodeStok = "Distok" | "BeliHarian";

export type StatusAktifBahan = "Aktif" | "Nonaktif";

export type StatusStok = "BELI" | "WASPADA" | "AMAN";

export type MasterLokasi = {
  kode: KodeLokasi;
  namaLokasi: string;
  jenis: string;
};

export type MasterSupplier = {
  kode: string;
  nama: string;
  kategori: string;
  hariOrder: string;
};

export type MasterBahan = {
  kodeBahan: string;
  namaBaku: string;
  kategori: string;
  satuanBeli: string;
  satuanPakai: string;
  konversi: number;
  hargaPerSatuanPakai: number;
  supplierUtama: string;
  stokMinimum: number;
  stokAman: number;
  stokMaksimum: number;
  statusAktif: StatusAktifBahan;
  /** Default "Distok" — BeliHarian di-exclude dari stok kritis dashboard. */
  metodeStok: MetodeStok;
};

export type BarangMasuk = {
  id?: string;
  tanggal: string;
  kodeBahan: string;
  qty: number;
  satuan: string;
  totalHarga: number;
  supplier: string;
  lokasiTujuan: KodeLokasi | string;
  diterimaOleh: string;
};

export type TransferStok = {
  id?: string;
  tanggal: string;
  kodeBahan: string;
  qty: number;
  dariLokasi: KodeLokasi | string;
  keLokasi: KodeLokasi | string;
  dikeluarkanOleh: string;
  diterimaOleh: string;
};

export type PemakaianOutlet = {
  id?: string;
  tanggal: string;
  kodeBahan: string;
  qty: number;
  lokasi: KodeLokasi | string;
  jenisPemakaian: string;
  pic: string;
};

export type WasteSelisih = {
  id?: string;
  tanggal: string;
  kodeBahan: string;
  lokasi: KodeLokasi | string;
  jenis: string;
  qty: number;
  alasan: string;
};

export type OpnameAwal = {
  id?: string;
  tanggal: string;
  kodeBahan: string;
  lokasi: KodeLokasi | string;
  qtyAwal: number;
};

export type StokKritisItem = {
  kodeBahan: string;
  namaBaku: string;
  saldoTotal: number;
  status: "BELI" | "WASPADA";
  estimasiKekuranganNilai: number;
};

export type AnomaliStokItem = {
  kodeBahan: string;
  namaBaku: string;
  lokasi: string;
  saldo: number;
};

/** Kategori bahan yang di-opname saat closing KDS (marinasi, prep, dll.). */
export type ClosingProdukKategori = "ready-to-sale" | "bahan-mentah" | "lainnya";

/** Aturan opname closing — owner/leader bisa set mana yang wajib diisi malam hari. */
export type ClosingOpnameRule = {
  id: string;
  outletId: string;
  /** Kosong = semua station di outlet. */
  stationId?: string;
  kodeBahan: string;
  /** Label lapangan, mis. "Ayam Paha Marinasi". */
  label: string;
  wajibOpname: boolean;
  kategori: ClosingProdukKategori;
  lokasiStok: KodeLokasi | string;
};

/** Baris checklist opname di KDS — stok sistem diisi otomatis. */
export type KdsClosingChecklistItem = {
  ruleId: string;
  kodeBahan: string;
  label: string;
  namaBaku: string;
  satuanPakai: string;
  lokasi: string;
  stokSistem: number;
  sudahOpnameHariIni: boolean;
};
