import type { IconName } from "./types";
import type { RequestStatus } from "./feedback";

// Definisi form (data-driven). Maksimal 5–8 field, banyak dropdown — ramah staf gaptek.
// Menambah form baru = cukup tambah entri di FORMS, tanpa ubah UI.

export type FieldType = "text" | "textarea" | "number" | "select" | "date";

export type FormField = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  options?: string[]; // untuk type "select"
};

export type FormType =
  | "request_bahan"
  | "lapor_kendala"
  | "izin"
  | "opening_outlet"
  | "closing_outlet"
  | "handover_shift"
  | "komplain_pelanggan"
  | "pengeluaran_kas_kecil"
  | "kasbon"
  | "waste_bahan"
  | "stock_opname"
  | "barang_masuk"
  | "barang_keluar"
  | "konfirmasi_terima_bahan"
  | "waste_produksi_nf"
  | "hasil_packing_nf"
  | "setoran_kasir"
  | "selisih_kas"
  | "upload_nota";

export type FormDef = {
  type: FormType;
  label: string;
  desc: string;
  icon: IconName;
  fields: FormField[];
  /** Batasi visibilitas per bisnis outlet. Kosong = semua outlet. */
  bisnis?: ("KBU" | "Kisamen" | "Samtaro" | "NF")[];
  /** Minta foto bukti? (fase skeleton: hanya dicatat nama file) */
  photo?: boolean;
  /** Buat task otomatis setelah submit. */
  createsTask: boolean;
  /** Masuk antrian approval. */
  needsApproval: boolean;
  /** Status awal setelah submit. */
  initialStatus: RequestStatus;
  /** Penjelasan singkat ke mana request diteruskan (untuk feedback ke staf). */
  routeNote: string;
};

const AREAS = ["Dapur", "Bar", "Kasir", "Gudang", "Floor / Waiters"];
const AREAS_WASTE = [...AREAS, "Produksi", "Packing", "CS", "Marketplace"];

export const FORMS: Record<FormType, FormDef> = {
  request_bahan: {
    type: "request_bahan",
    label: "Request Bahan",
    desc: "Minta bahan/stok ke gudang atau purchasing.",
    icon: "package",
    createsTask: true,
    needsApproval: true,
    initialStatus: "menunggu_dicek",
    routeNote: "Diteruskan ke Leader untuk dicek, lalu Gudang/Purchasing.",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: AREAS },
      { name: "nama_bahan", label: "Nama Bahan", type: "text", required: true, placeholder: "cth: Ayam" },
      { name: "jumlah", label: "Jumlah", type: "number", required: true, placeholder: "cth: 10" },
      {
        name: "satuan",
        label: "Satuan",
        type: "select",
        required: true,
        options: ["kg", "gram", "liter", "pcs", "dus", "pack"]
      },
      {
        name: "urgensi",
        label: "Kebutuhan",
        type: "select",
        required: true,
        options: ["Hari Ini", "Besok", "Minggu Ini"]
      },
      { name: "catatan", label: "Catatan (opsional)", type: "textarea", placeholder: "Tambahan info bila perlu" }
    ]
  },
  lapor_kendala: {
    type: "lapor_kendala",
    label: "Lapor Kendala",
    desc: "Ada alat rusak, stok habis, atau masalah lain?",
    icon: "alert-triangle",
    photo: true,
    createsTask: true,
    needsApproval: false,
    initialStatus: "diproses",
    routeNote: "Langsung diteruskan ke Leader/Teknis untuk ditindaklanjuti.",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: AREAS },
      {
        name: "jenis",
        label: "Jenis Kendala",
        type: "select",
        required: true,
        options: ["Alat Rusak", "Stok Habis", "POS Error", "Kebersihan", "Lainnya"]
      },
      { name: "deskripsi", label: "Ceritakan Kendalanya", type: "textarea", required: true, placeholder: "Apa yang terjadi?" }
    ]
  },
  izin: {
    type: "izin",
    label: "Izin / Absensi",
    desc: "Izin tidak masuk, telat, pulang awal, tukar shift, lembur.",
    icon: "life-buoy",
    createsTask: false,
    needsApproval: true,
    initialStatus: "menunggu_dicek",
    routeNote: "Menunggu persetujuan Leader.",
    fields: [
      {
        name: "jenis",
        label: "Jenis",
        type: "select",
        required: true,
        options: ["Izin Tidak Masuk", "Terlambat", "Pulang Lebih Awal", "Tukar Shift", "Lembur"]
      },
      { name: "tanggal", label: "Tanggal", type: "date", required: true },
      { name: "alasan", label: "Alasan", type: "textarea", required: true, placeholder: "Tulis alasanmu" }
    ]
  },
  opening_outlet: {
    type: "opening_outlet",
    label: "Opening Outlet",
    desc: "Ceklist buka outlet: stok awal, kebersihan, alat siap.",
    icon: "store",
    photo: true,
    createsTask: true,
    needsApproval: false,
    initialStatus: "menunggu_dicek",
    routeNote: "Task opening ke leader verifikasi → masuk report harian outlet.",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: AREAS },
      { name: "shift", label: "Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      {
        name: "ceklist",
        label: "Yang sudah dicek",
        type: "select",
        required: true,
        options: ["Stok awal OK", "Alat OK", "Kebersihan OK", "Ada yang kurang"]
      },
      { name: "catatan", label: "Catatan", type: "textarea", placeholder: "Bila ada yang kurang, tulis di sini" }
    ]
  },
  closing_outlet: {
    type: "closing_outlet",
    label: "Closing Outlet",
    desc: "Tutup shift: bersih-bersih, stok sisa, alat dimatikan.",
    icon: "store",
    photo: true,
    createsTask: true,
    needsApproval: false,
    initialStatus: "menunggu_dicek",
    routeNote: "Task closing menunggu verifikasi leader (maks jam 22:30).",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: AREAS },
      { name: "shift", label: "Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      {
        name: "kondisi",
        label: "Kondisi Tutup",
        type: "select",
        required: true,
        options: ["Semua beres", "Ada catatan", "Perlu tindak lanjut"]
      },
      { name: "catatan", label: "Catatan closing", type: "textarea" }
    ]
  },
  handover_shift: {
    type: "handover_shift",
    label: "Serah Terima Shift",
    desc: "Serah terima antar shift: stok sisa, kas kecil, catatan penting.",
    icon: "users",
    createsTask: false,
    needsApproval: false,
    initialStatus: "selesai",
    routeNote: "Leader baca di inbox → masuk log handover outlet.",
    fields: [
      { name: "dari_shift", label: "Dari Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      { name: "ke_shift", label: "Ke Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      { name: "stok_penting", label: "Stok/Catatan Penting", type: "textarea", required: true },
      { name: "kas_kecil", label: "Kas Kecil (Rp)", type: "number", placeholder: "0 bila tidak ada" }
    ]
  },
  komplain_pelanggan: {
    type: "komplain_pelanggan",
    label: "Komplain Pelanggan",
    desc: "Catat keluhan dine-in / takeaway dari pelanggan.",
    icon: "alert-triangle",
    photo: true,
    createsTask: true,
    needsApproval: false,
    initialStatus: "menunggu_dicek",
    routeNote: "Task follow-up ke leader/QC → masuk Rating Report.",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: ["Dine-in", "Takeaway", "Delivery"] },
      {
        name: "kategori",
        label: "Masalah",
        type: "select",
        required: true,
        options: ["Rasa", "Waktu Tunggu", "Pelayanan", "Kebersihan", "Stok Kosong", "Packaging", "Harga", "Lainnya"]
      },
      { name: "rating", label: "Rating (1–5)", type: "select", required: true, options: ["1", "2", "3", "4", "5"] },
      { name: "cerita", label: "Cerita Pelanggan", type: "textarea", required: true }
    ]
  },
  waste_bahan: {
    type: "waste_bahan",
    label: "Waste Bahan",
    desc: "Catat bahan rusak, hangus, atau tidak terpakai.",
    icon: "package",
    photo: true,
    createsTask: false,
    needsApproval: false,
    initialStatus: "diproses",
    routeNote: "Waste tercatat. Leader & owner bisa lihat di inbox/report waste.",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: AREAS_WASTE },
      { name: "nama_bahan", label: "Nama Bahan", type: "text", required: true, placeholder: "cth: Ayam, Susu, Cup" },
      { name: "jumlah", label: "Jumlah", type: "number", required: true, placeholder: "cth: 2" },
      {
        name: "satuan",
        label: "Satuan",
        type: "select",
        required: true,
        options: ["kg", "gram", "liter", "pcs", "pack"]
      },
      {
        name: "alasan",
        label: "Alasan Waste",
        type: "select",
        required: true,
        options: ["Kadaluarsa", "Rusak", "Over Prep", "Salah Masak", "Contoh QC", "Lainnya"]
      },
      { name: "catatan", label: "Catatan (opsional)", type: "textarea" }
    ]
  },
  stock_opname: {
    type: "stock_opname",
    label: "Stock Opname",
    desc: "Hitung stok fisik vs stok sistem.",
    icon: "list-checks",
    photo: true,
    createsTask: true,
    needsApproval: true,
    initialStatus: "menunggu_dicek",
    routeNote: "Menunggu leader/gudang verifikasi selisih opname.",
    fields: [
      {
        name: "lokasi",
        label: "Lokasi",
        type: "select",
        required: true,
        options: ["Gudang Pusat", "Gudang Outlet", "Chiller Dapur", "Freezer"]
      },
      { name: "nama_bahan", label: "Nama Bahan", type: "text", required: true },
      { name: "stok_sistem", label: "Stok Sistem", type: "number", required: true },
      { name: "stok_fisik", label: "Stok Fisik (Hasil Hitung)", type: "number", required: true },
      { name: "catatan", label: "Catatan Selisih", type: "textarea", placeholder: "Jelaskan bila ada selisih besar" }
    ]
  },
  setoran_kasir: {
    type: "setoran_kasir",
    label: "Setoran Kasir",
    desc: "Setor uang hasil penjualan shift (cash, QRIS, online).",
    icon: "banknote",
    bisnis: ["KBU", "Kisamen", "Samtaro"],
    photo: true,
    createsTask: false,
    needsApproval: true,
    initialStatus: "menunggu_dicek",
    routeNote: "Menunggu leader verifikasi setoran → admin catat kas masuk.",
    fields: [
      { name: "shift", label: "Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      { name: "cash", label: "Cash Fisik (Rp)", type: "number", required: true },
      { name: "qris", label: "QRIS (Rp)", type: "number", placeholder: "0" },
      { name: "online", label: "GoFood/Grab/Shopee (Rp)", type: "number", placeholder: "0" },
      { name: "total_penjualan", label: "Total Penjualan Sistem (Rp)", type: "number", required: true }
    ]
  },
  pengeluaran_kas_kecil: {
    type: "pengeluaran_kas_kecil",
    label: "Pengeluaran Kas Kecil",
    desc: "Belanja dadakan dari kas kecil outlet (transport, ATK, dll).",
    icon: "receipt",
    photo: true,
    createsTask: false,
    needsApproval: true,
    initialStatus: "menunggu_dicek",
    routeNote: "Leader approve (< Rp200rb) / owner approve (besar) → catat kas keluar.",
    fields: [
      { name: "nominal", label: "Nominal (Rp)", type: "number", required: true },
      {
        name: "keperluan",
        label: "Keperluan",
        type: "select",
        required: true,
        options: ["Transport", "ATK", "Perbaikan Kecil", "Kebutuhan Outlet", "Lainnya"]
      },
      { name: "keterangan", label: "Keterangan", type: "textarea", required: true }
    ]
  },
  kasbon: {
    type: "kasbon",
    label: "Ajukan Kasbon",
    desc: "Pinjam uang muka (potong gaji nanti).",
    icon: "wallet",
    createsTask: false,
    needsApproval: true,
    initialStatus: "menunggu_dicek",
    routeNote: "Leader rekomendasi → admin/owner approve → tercatat di slip gaji.",
    fields: [
      { name: "nominal", label: "Nominal (Rp)", type: "number", required: true },
      { name: "alasan", label: "Alasan", type: "textarea", required: true },
      { name: "cicilan", label: "Potong Berapa Kali Gaji?", type: "select", options: ["1x", "2x", "3x"] }
    ]
  },
  barang_masuk: {
    type: "barang_masuk",
    label: "Barang Masuk",
    desc: "Catat barang diterima dari gudang/purchasing/supplier.",
    icon: "package",
    photo: true,
    createsTask: false,
    needsApproval: false,
    initialStatus: "diterima",
    routeNote: "Stok bertambah → link ke PO/nota bila ada.",
    fields: [
      {
        name: "sumber",
        label: "Dari Mana",
        type: "select",
        required: true,
        options: ["Purchasing", "Transfer Gudang", "Retur", "Produksi NF"]
      },
      { name: "nama_bahan", label: "Nama Barang", type: "text", required: true },
      { name: "jumlah", label: "Jumlah", type: "number", required: true },
      { name: "satuan", label: "Satuan", type: "select", required: true, options: ["kg", "pcs", "dus", "pack"] },
      { name: "no_referensi", label: "No. PO/Transfer (opsional)", type: "text" }
    ]
  },
  barang_keluar: {
    type: "barang_keluar",
    label: "Barang Keluar / Transfer",
    desc: "Kirim bahan dari gudang ke outlet atau antar outlet.",
    icon: "package",
    createsTask: true,
    needsApproval: false,
    initialStatus: "dikirim",
    routeNote: "Stok gudang berkurang → outlet konfirmasi terima.",
    fields: [
      {
        name: "tujuan",
        label: "Tujuan",
        type: "select",
        required: true,
        options: ["KBU", "Kisamen", "Samtaro", "NF Produksi", "Outlet Lain"]
      },
      { name: "nama_bahan", label: "Nama Barang", type: "text", required: true },
      { name: "jumlah", label: "Jumlah", type: "number", required: true },
      { name: "satuan", label: "Satuan", type: "select", required: true, options: ["kg", "pcs", "dus", "pack"] }
    ]
  },
  konfirmasi_terima_bahan: {
    type: "konfirmasi_terima_bahan",
    label: "Konfirmasi Barang Diterima",
    desc: "Outlet konfirmasi request/transfer sudah sampai.",
    icon: "check-circle",
    photo: true,
    createsTask: false,
    needsApproval: false,
    initialStatus: "selesai",
    routeNote: "Status request/transfer jadi Sudah Diterima.",
    fields: [
      { name: "no_request", label: "No. Request/Transfer", type: "text", required: true },
      {
        name: "kondisi",
        label: "Kondisi Barang",
        type: "select",
        required: true,
        options: ["Lengkap & OK", "Kurang", "Rusak Sebagian"]
      },
      { name: "catatan", label: "Catatan", type: "textarea" }
    ]
  },
  waste_produksi_nf: {
    type: "waste_produksi_nf",
    label: "Waste Produksi (NF)",
    desc: "Catat sisa/reject produksi umpan — produksi & packing.",
    icon: "package",
    bisnis: ["NF"],
    photo: true,
    createsTask: false,
    needsApproval: false,
    initialStatus: "diproses",
    routeNote: "Stok bahan baku/FG berkurang → report efisiensi produksi NF.",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: ["Produksi", "Packing"] },
      { name: "produk", label: "Produk/Bahan", type: "text", required: true },
      { name: "jumlah", label: "Jumlah", type: "number", required: true },
      { name: "satuan", label: "Satuan", type: "select", options: ["kg", "pack", "pcs"] },
      {
        name: "alasan",
        label: "Alasan",
        type: "select",
        options: ["Reject QC", "Mesin Error", "Bahan Rusak", "Sample", "Lainnya"]
      }
    ]
  },
  hasil_packing_nf: {
    type: "hasil_packing_nf",
    label: "Lapor Hasil Packing (NF)",
    desc: "Staf packing laporkan jumlah pack selesai hari ini.",
    icon: "clipboard-list",
    bisnis: ["NF"],
    createsTask: false,
    needsApproval: false,
    initialStatus: "selesai",
    routeNote: "Stok produk jadi naik → CS/marketplace lihat ketersediaan.",
    fields: [
      { name: "produk", label: "Produk", type: "text", required: true },
      { name: "jumlah_pack", label: "Jumlah Pack", type: "number", required: true },
      { name: "shift", label: "Shift", type: "select", options: ["Pagi", "Siang"] }
    ]
  },
  selisih_kas: {
    type: "selisih_kas",
    label: "Selisih Kas / Kas Hilang",
    desc: "Ada selisih antara uang fisik vs sistem? Laporkan di sini.",
    icon: "alert-triangle",
    photo: true,
    createsTask: true,
    needsApproval: true,
    initialStatus: "menunggu_dicek",
    routeNote: "Task investigasi ke leader → owner review bila selisih besar.",
    fields: [
      { name: "shift", label: "Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      {
        name: "selisih",
        label: "Selisih (Rp)",
        type: "number",
        required: true,
        placeholder: "Minus = kurang, Plus = lebih"
      },
      { name: "penjelasan", label: "Penjelasan", type: "textarea", required: true }
    ]
  },
  upload_nota: {
    type: "upload_nota",
    label: "Upload Nota Belanja",
    desc: "Foto nota belanja bahan/packaging/supplier.",
    icon: "upload",
    photo: true,
    createsTask: false,
    needsApproval: false,
    initialStatus: "menunggu_dicek",
    routeNote: "Purchasing/admin input harga aktual → finance catat kas keluar/utang.",
    fields: [
      { name: "supplier", label: "Supplier / Toko", type: "text", required: true },
      { name: "nominal", label: "Nominal Nota (Rp)", type: "number", required: true },
      {
        name: "keperluan",
        label: "Keperluan",
        type: "select",
        options: ["Bahan", "Packaging", "ATK", "Maintenance", "Lainnya"]
      },
      { name: "catatan", label: "Catatan", type: "textarea" }
    ]
  }
};

export function getForm(type: string): FormDef | undefined {
  return (FORMS as Record<string, FormDef>)[type];
}

export const FORM_LIST: FormDef[] = Object.values(FORMS);

/** Form yang sudah diimplementasi — disembunyikan dari bagian "Segera Hadir" di roadmap. */
export const ACTIVE_FORM_TYPES = new Set(FORM_LIST.map((f) => f.type));
