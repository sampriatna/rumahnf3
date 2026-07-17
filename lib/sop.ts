// Knowledge base SOP internal (fase skeleton: konten contoh inline).
// Diganti tabel nf3.sops + file storage / Google Drive di fase berikutnya.

export type Sop = {
  id: string;
  title: string;
  category: string;
  outletScope: string; // "Semua" atau nama outlet
  roleScope: string; // "Semua", "Bar", "Dapur", dll
  content: string;
  version: number;
  updatedAt: string;
};

export const SOPS: Sop[] = [
  {
    id: "sop-opening-bar",
    title: "SOP Opening Bar",
    category: "Opening",
    outletScope: "Semua",
    roleScope: "Bar",
    version: 2,
    updatedAt: "2026-05-20",
    content:
      "1. Nyalakan mesin kopi, tunggu pemanasan 15 menit.\n2. Cek stok susu, kopi, dan cup. Bila kurang, isi Form Request Bahan.\n3. Bersihkan area bar & meja kerja.\n4. Siapkan es dan air panas.\n5. Foto kondisi bar lalu kirim Form Opening."
  },
  {
    id: "sop-closing-kasir",
    title: "SOP Closing Kasir",
    category: "Closing",
    outletScope: "Semua",
    roleScope: "Kasir",
    version: 1,
    updatedAt: "2026-05-18",
    content:
      "1. Hitung uang fisik di laci.\n2. Cocokkan dengan total penjualan sistem.\n3. Bila ada selisih, isi Form Selisih Kas.\n4. Setor uang sesuai prosedur.\n5. Matikan POS dan rapikan area kasir."
  },
  {
    id: "sop-prep-ayam",
    title: "SOP Prep Ayam (Dapur)",
    category: "Dapur",
    outletScope: "Samtaro Express",
    roleScope: "Dapur",
    version: 3,
    updatedAt: "2026-06-01",
    content:
      "1. Cuci ayam dengan air mengalir.\n2. Marinasi sesuai takaran standar.\n3. Simpan di chiller dengan label tanggal.\n4. FIFO: pakai stok paling lama dulu.\n5. Catat waste bila ada lewat Form Waste Bahan."
  },
  {
    id: "aturan-izin",
    title: "Aturan Izin & Kehadiran",
    category: "HR",
    outletScope: "Semua",
    roleScope: "Semua",
    version: 1,
    updatedAt: "2026-05-10",
    content:
      "1. Izin diajukan minimal H-1 lewat Form Izin.\n2. Tukar shift harus disetujui Leader.\n3. Terlambat tanpa kabar dapat memengaruhi penilaian.\n4. Lembur harus atas persetujuan Leader sebelum dikerjakan."
  }
];

export function getSop(id: string) {
  return SOPS.find((s) => s.id === id);
}
