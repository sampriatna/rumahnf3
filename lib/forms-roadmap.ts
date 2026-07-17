import type { Phase } from "./types";
import type { IconName } from "./types";
import type { FormField } from "./forms";

// Roadmap form untuk fase berikutnya. BELUM aktif di UI submit — hanya perencanaan + preview.
// Disusun sesuai model bisnis: Nusa Food Group (KBU, Kisamen, Samtaro) + Nusa Fishing (NF).
// Prinsip: max 5–8 field, banyak dropdown, foto hanya bila wajib.

export type FormRoadmapEntry = {
  type: string;
  label: string;
  desc: string;
  icon: IconName;
  phase: Phase;
  /** Outlet/bisnis mana yang paling relevan. "Semua" = lintas outlet. */
  bisnis: ("KBU" | "Kisamen" | "Samtaro" | "NF" | "Semua")[];
  /** Siapa yang mengisi form ini. */
  pengisi: ("staff" | "leader" | "gudang" | "kasir")[];
  fields: FormField[];
  photo?: boolean;
  createsTask: boolean;
  needsApproval: boolean;
  /** Ke modul mana data masuk setelah submit. */
  targetTable: string;
  /** Alur singkat setelah submit (untuk staf & developer). */
  alur: string;
  /** Contoh QR shortcut (kode & area). */
  qrHint?: string;
};

const AREAS_FNB = ["Dapur", "Bar", "Kasir", "Floor / Waiters", "Gudang Outlet"];
const AREAS_NF = ["Produksi", "Packing", "Gudang", "CS", "Marketplace"];

// ---------------------------------------------------------------------------
// FASE 2 lanjutan — operasional harian outlet (opening/closing/shift/komplain)
// ---------------------------------------------------------------------------
const FASE_2_LANJUT: FormRoadmapEntry[] = [
  {
    type: "opening_outlet",
    label: "Opening Outlet",
    desc: "Ceklist buka outlet: stok awal, kebersihan, alat siap.",
    icon: "store",
    phase: 2,
    bisnis: ["KBU", "Kisamen", "Samtaro", "Semua"],
    pengisi: ["leader", "staff"],
    photo: true,
    createsTask: true,
    needsApproval: false,
    targetTable: "nf3.form_submissions → task opening",
    alur: "Submit → task opening ke leader verifikasi → masuk report harian outlet.",
    qrHint: "kbu-bar-opening",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: AREAS_FNB },
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
  {
    type: "closing_outlet",
    label: "Closing Outlet",
    desc: "Tutup shift: bersih-bersih, stok sisa, alat dimatikan.",
    icon: "store",
    phase: 2,
    bisnis: ["KBU", "Kisamen", "Samtaro", "Semua"],
    pengisi: ["leader", "staff"],
    photo: true,
    createsTask: true,
    needsApproval: false,
    targetTable: "nf3.form_submissions → task closing",
    alur: "Submit → task closing menunggu verifikasi leader (maks jam 22:30).",
    qrHint: "kbu-dapur-closing",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: AREAS_FNB },
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
  {
    type: "handover_shift",
    label: "Serah Terima Shift",
    desc: "Serah terima antar shift: stok sisa, kas kecil, catatan penting.",
    icon: "users",
    phase: 2,
    bisnis: ["Semua"],
    pengisi: ["staff", "leader"],
    photo: false,
    createsTask: false,
    needsApproval: false,
    targetTable: "nf3.form_submissions",
    alur: "Submit → leader baca di inbox → masuk log handover outlet.",
    fields: [
      { name: "dari_shift", label: "Dari Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      { name: "ke_shift", label: "Ke Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      { name: "stok_penting", label: "Stok/Catatan Penting", type: "textarea", required: true },
      { name: "kas_kecil", label: "Kas Kecil (Rp)", type: "number", placeholder: "0 bila tidak ada" }
    ]
  },
  {
    type: "komplain_pelanggan",
    label: "Komplain Pelanggan",
    desc: "Catat keluhan dine-in / takeaway dari pelanggan.",
    icon: "alert-triangle",
    phase: 2,
    bisnis: ["KBU", "Kisamen", "Samtaro"],
    pengisi: ["staff", "kasir"],
    photo: true,
    createsTask: true,
    needsApproval: false,
    targetTable: "nf3.form_submissions → nf3.ratings",
    alur: "Submit → task follow-up ke leader/QC → masuk Rating Report → bisa balas komplain.",
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
  }
];

// ---------------------------------------------------------------------------
// FASE 3 — butuh approval (izin sudah ada; tambah kas kecil & kasbon)
// ---------------------------------------------------------------------------
const FASE_3: FormRoadmapEntry[] = [
  {
    type: "pengeluaran_kas_kecil",
    label: "Pengeluaran Kas Kecil",
    desc: "Belanja dadakan dari kas kecil outlet (transport, ATK, dll).",
    icon: "receipt",
    phase: 3,
    bisnis: ["Semua"],
    pengisi: ["staff", "leader"],
    photo: true,
    createsTask: false,
    needsApproval: true,
    targetTable: "nf3.approvals + nf3.finance_ledger",
    alur: "Submit → leader approve (< Rp200rb) / owner approve (besar) → catat kas keluar.",
    fields: [
      { name: "nominal", label: "Nominal (Rp)", type: "number", required: true },
      { name: "keperluan", label: "Keperluan", type: "select", required: true, options: ["Transport", "ATK", "Perbaikan Kecil", "Kebutuhan Outlet", "Lainnya"] },
      { name: "keterangan", label: "Keterangan", type: "textarea", required: true }
    ]
  },
  {
    type: "kasbon",
    label: "Ajukan Kasbon",
    desc: "Pinjam uang muka (potong gaji nanti).",
    icon: "wallet",
    phase: 3,
    bisnis: ["Semua"],
    pengisi: ["staff"],
    photo: false,
    createsTask: false,
    needsApproval: true,
    targetTable: "nf3.approvals → nf3.payroll (cash_advance)",
    alur: "Submit → leader rekomendasi → admin/owner approve → tercatat di slip gaji.",
    fields: [
      { name: "nominal", label: "Nominal (Rp)", type: "number", required: true },
      { name: "alasan", label: "Alasan", type: "textarea", required: true },
      { name: "cicilan", label: "Potong Berapa Kali Gaji?", type: "select", options: ["1x", "2x", "3x"] }
    ]
  }
];

// ---------------------------------------------------------------------------
// FASE 5 — inventory & gudang (waste, opname, barang masuk/keluar)
// ---------------------------------------------------------------------------
const FASE_5: FormRoadmapEntry[] = [
  {
    type: "waste_bahan",
    label: "Waste Bahan",
    desc: "Catat bahan rusak/hangus/tidak terpakai — penting untuk kontrol cost.",
    icon: "package",
    phase: 5,
    bisnis: ["KBU", "Kisamen", "Samtaro", "NF"],
    pengisi: ["staff", "gudang"],
    photo: true,
    createsTask: false,
    needsApproval: false,
    targetTable: "nf3.form_submissions → nf3.stock_movements (Waste)",
    alur: "Submit → stok outlet berkurang → masuk report waste outlet → owner lihat waste tertinggi.",
    qrHint: "kbu-dapur-waste",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: [...AREAS_FNB, ...AREAS_NF] },
      { name: "nama_bahan", label: "Nama Bahan", type: "text", required: true },
      { name: "jumlah", label: "Jumlah", type: "number", required: true },
      { name: "satuan", label: "Satuan", type: "select", required: true, options: ["kg", "gram", "liter", "pcs", "pack"] },
      {
        name: "alasan",
        label: "Alasan Waste",
        type: "select",
        required: true,
        options: ["Kadaluarsa", "Rusak", "Over Prep", "Salah Masak", "Contoh QC", "Lainnya"]
      },
      { name: "catatan", label: "Catatan", type: "textarea" }
    ]
  },
  {
    type: "stock_opname",
    label: "Stock Opname",
    desc: "Hitung stok fisik vs sistem — untuk gudang & outlet.",
    icon: "list-checks",
    phase: 5,
    bisnis: ["Semua"],
    pengisi: ["gudang", "leader"],
    photo: true,
    createsTask: true,
    needsApproval: true,
    targetTable: "nf3.stock_movements (Opname Correction)",
    alur: "Submit → leader/gudang verifikasi selisih → koreksi stok → report selisih opname.",
    qrHint: "kbu-gudang-opname",
    fields: [
      { name: "lokasi", label: "Lokasi", type: "select", required: true, options: ["Gudang Pusat", "Gudang Outlet", "Chiller Dapur", "Freezer"] },
      { name: "nama_bahan", label: "Nama Bahan", type: "text", required: true },
      { name: "stok_sistem", label: "Stok Sistem", type: "number", required: true },
      { name: "stok_fisik", label: "Stok Fisik (Hasil Hitung)", type: "number", required: true },
      { name: "catatan", label: "Catatan Selisih", type: "textarea" }
    ]
  },
  {
    type: "barang_masuk",
    label: "Barang Masuk",
    desc: "Catat barang diterima dari gudang/purchasing/supplier.",
    icon: "package",
    phase: 5,
    bisnis: ["Semua"],
    pengisi: ["gudang", "staff"],
    photo: true,
    createsTask: false,
    needsApproval: false,
    targetTable: "nf3.stock_movements (Stock In)",
    alur: "Submit → stok bertambah → link ke PO/nota bila ada → outlet konfirmasi diterima.",
    fields: [
      { name: "sumber", label: "Dari Mana", type: "select", required: true, options: ["Purchasing", "Transfer Gudang", "Retur", "Produksi NF"] },
      { name: "nama_bahan", label: "Nama Barang", type: "text", required: true },
      { name: "jumlah", label: "Jumlah", type: "number", required: true },
      { name: "satuan", label: "Satuan", type: "select", required: true, options: ["kg", "pcs", "dus", "pack"] },
      { name: "no_referensi", label: "No. PO/Transfer (opsional)", type: "text" }
    ]
  },
  {
    type: "barang_keluar",
    label: "Barang Keluar / Transfer",
    desc: "Kirim bahan dari gudang ke outlet atau antar outlet.",
    icon: "package",
    phase: 5,
    bisnis: ["Semua"],
    pengisi: ["gudang"],
    photo: false,
    createsTask: true,
    needsApproval: false,
    targetTable: "nf3.stock_movements (Transfer Out/In)",
    alur: "Submit → stok gudang berkurang → task ke outlet konfirmasi terima → stok outlet naik.",
    fields: [
      { name: "tujuan", label: "Tujuan", type: "select", required: true, options: ["KBU", "Kisamen", "Samtaro", "NF Produksi", "Outlet Lain"] },
      { name: "nama_bahan", label: "Nama Barang", type: "text", required: true },
      { name: "jumlah", label: "Jumlah", type: "number", required: true },
      { name: "satuan", label: "Satuan", type: "select", required: true, options: ["kg", "pcs", "dus", "pack"] }
    ]
  },
  {
    type: "konfirmasi_terima_bahan",
    label: "Konfirmasi Barang Diterima",
    desc: "Outlet konfirmasi request/transfer sudah sampai.",
    icon: "check-circle",
    phase: 5,
    bisnis: ["Semua"],
    pengisi: ["staff", "leader"],
    photo: true,
    createsTask: false,
    needsApproval: false,
    targetTable: "nf3.request_status → selesai",
    alur: "Submit → status request bahan jadi 'Sudah Diterima' → tutup loop request→belanja→terima.",
    fields: [
      { name: "no_request", label: "No. Request/Transfer", type: "text", required: true },
      { name: "kondisi", label: "Kondisi Barang", type: "select", required: true, options: ["Lengkap & OK", "Kurang", "Rusak Sebagian"] },
      { name: "catatan", label: "Catatan", type: "textarea" }
    ]
  },
  // Khusus Nusa Fishing
  {
    type: "waste_produksi_nf",
    label: "Waste Produksi (NF)",
    desc: "Catat sisa/ reject produksi umpan — produksi & packing.",
    icon: "package",
    phase: 5,
    bisnis: ["NF"],
    pengisi: ["staff", "gudang"],
    photo: true,
    createsTask: false,
    needsApproval: false,
    targetTable: "nf3.stock_movements (Waste) + report produksi",
    alur: "Submit → stok bahan baku/FG berkurang → report efisiensi produksi NF.",
    fields: [
      { name: "area", label: "Area", type: "select", required: true, options: ["Produksi", "Packing"] },
      { name: "produk", label: "Produk/Bahan", type: "text", required: true },
      { name: "jumlah", label: "Jumlah", type: "number", required: true },
      { name: "satuan", label: "Satuan", type: "select", options: ["kg", "pack", "pcs"] },
      { name: "alasan", label: "Alasan", type: "select", options: ["Reject QC", "Mesin Error", "Bahan Rusak", "Sample", "Lainnya"] }
    ]
  },
  {
    type: "hasil_packing_nf",
    label: "Lapor Hasil Packing (NF)",
    desc: "Staf packing laporkan jumlah pack selesai hari ini.",
    icon: "clipboard-list",
    phase: 5,
    bisnis: ["NF"],
    pengisi: ["staff"],
    photo: false,
    createsTask: false,
    needsApproval: false,
    targetTable: "nf3.form_submissions → stok FG",
    alur: "Submit → stok produk jadi naik → CS/marketplace lihat ketersediaan.",
    fields: [
      { name: "produk", label: "Produk", type: "text", required: true },
      { name: "jumlah_pack", label: "Jumlah Pack", type: "number", required: true },
      { name: "shift", label: "Shift", type: "select", options: ["Pagi", "Siang"] }
    ]
  }
];

// ---------------------------------------------------------------------------
// FASE 6 — finance / kas (setoran kasir, selisih kas, upload nota)
// ---------------------------------------------------------------------------
const FASE_6: FormRoadmapEntry[] = [
  {
    type: "setoran_kasir",
    label: "Setoran Kasir",
    desc: "Setor uang hasil penjualan shift (cash + QRIS + online).",
    icon: "banknote",
    phase: 6,
    bisnis: ["KBU", "Kisamen", "Samtaro"],
    pengisi: ["kasir", "staff"],
    photo: true,
    createsTask: false,
    needsApproval: true,
    targetTable: "nf3.finance_ledger (kas masuk) + nf3.approvals",
    alur: "Submit → leader verifikasi → admin catat kas masuk → owner lihat 'Kas Masuk Hari Ini'.",
    qrHint: "kbu-kasir-setoran",
    fields: [
      { name: "shift", label: "Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      { name: "cash", label: "Cash Fisik (Rp)", type: "number", required: true },
      { name: "qris", label: "QRIS (Rp)", type: "number", placeholder: "0" },
      { name: "online", label: "GoFood/Grab/Shopee (Rp)", type: "number", placeholder: "0" },
      { name: "total_penjualan", label: "Total Penjualan Sistem (Rp)", type: "number", required: true }
    ]
  },
  {
    type: "selisih_kas",
    label: "Selisih Kas / Kas Hilang",
    desc: "Ada selisih antara uang fisik vs sistem? Laporkan di sini.",
    icon: "alert-triangle",
    phase: 6,
    bisnis: ["Semua"],
    pengisi: ["kasir", "leader"],
    photo: true,
    createsTask: true,
    needsApproval: true,
    targetTable: "nf3.finance_ledger + nf3.approvals",
    alur: "Submit → task investigasi ke leader → owner review bila selisih besar.",
    qrHint: "kbu-kasir-selisih",
    fields: [
      { name: "shift", label: "Shift", type: "select", required: true, options: ["Pagi", "Siang", "Malam"] },
      { name: "selisih", label: "Selisih (Rp)", type: "number", required: true, placeholder: "Minus = kurang, Plus = lebih" },
      { name: "penjelasan", label: "Penjelasan", type: "textarea", required: true }
    ]
  },
  {
    type: "upload_nota",
    label: "Upload Nota Belanja",
    desc: "Foto nota belanja bahan/packaging/supplier.",
    icon: "upload",
    phase: 6,
    bisnis: ["Semua"],
    pengisi: ["staff", "gudang"],
    photo: true,
    createsTask: false,
    needsApproval: false,
    targetTable: "nf3.purchases.note_url + nf3.finance_ledger",
    alur: "Submit → purchasing/admin input harga aktual → finance catat kas keluar/utang supplier.",
    fields: [
      { name: "supplier", label: "Supplier / Toko", type: "text", required: true },
      { name: "nominal", label: "Nominal Nota (Rp)", type: "number", required: true },
      { name: "keperluan", label: "Keperluan", type: "select", options: ["Bahan", "Packaging", "ATK", "Maintenance", "Lainnya"] },
      { name: "catatan", label: "Catatan", type: "textarea" }
    ]
  }
];

export const FORMS_ROADMAP: FormRoadmapEntry[] = [
  ...FASE_2_LANJUT,
  ...FASE_3,
  ...FASE_5,
  ...FASE_6
];

/** Form aktif sekarang (Fase 2) vs yang masih roadmap. */
export function roadmapByPhase(phase: Phase) {
  return FORMS_ROADMAP.filter((f) => f.phase === phase);
}

export function roadmapForBisnis(code: "KBU" | "Kisamen" | "Samtaro" | "NF" | "Semua") {
  return FORMS_ROADMAP.filter((f) => f.bisnis.includes(code) || f.bisnis.includes("Semua"));
}
