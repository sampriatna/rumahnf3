import { ATTENDANCE_URL, TASK_DASHBOARD_URL } from "./constants";
import type { Role, RoleConfig } from "./types";

// Sumber kebenaran navigasi per role. Bahasa sengaja "bahasa lapangan".
// href "/segera?fitur=..." = placeholder untuk fitur yang dibangun di fase berikutnya.
// external + href TASK_DASHBOARD_URL = link-out ke Task Dashboard existing (tidak di-rebuild).

const STAFF: RoleConfig = {
  role: "staff",
  title: "Staf",
  tagline: "Slip gaji, SOP, lapor kerja — akun pribadimu.",
  menu: [
    {
      id: "presensi",
      label: "Presensi / Absen",
      desc: "Check-in GPS & selfie harian lewat GAWE.",
      icon: "clipboard-list",
      href: ATTENDANCE_URL,
      external: true,
      externalLabel: "Buka GAWE",
      phase: 1,
      ready: true
    },
    {
      id: "slip-gaji",
      label: "Slip Gaji Saya",
      desc: "Slip gaji pribadi (rahasia, hanya kamu).",
      icon: "wallet",
      href: "/staff/slip-gaji",
      phase: 6,
      ready: true,
      sensitive: true
    },
    {
      id: "sop",
      label: "SOP & Cara Kerja",
      desc: "Baca panduan kerja & product knowledge.",
      icon: "book-open",
      href: "/sop",
      phase: 2,
      ready: true
    },
    {
      id: "isi-form",
      label: "Isi Form",
      desc: "Request bahan, izin, waste, setoran, lapor kendala, dll.",
      icon: "file-plus",
      href: "/staff/form",
      phase: 2,
      ready: true
    },
    {
      id: "status-saya",
      label: "Status Request Saya",
      desc: "Cek request kamu: menunggu, diproses, selesai.",
      icon: "inbox",
      href: "/staff/status",
      phase: 2,
      ready: true
    }
  ]
};

const LEADER: RoleConfig = {
  role: "leader",
  title: "Leader Outlet",
  tagline: "Pantau outlet, approve, verifikasi tim.",
  menu: [
    {
      id: "dashboard-outlet",
      label: "Dashboard Outlet",
      desc: "Ringkasan kondisi outletmu hari ini.",
      icon: "store",
      href: "/reports/outlet",
      phase: 4,
      ready: true
    },
    {
      id: "task-tim",
      label: "Task Tim",
      desc: "Lihat tugas seluruh tim outlet.",
      icon: "list-checks",
      href: TASK_DASHBOARD_URL,
      external: true,
      externalLabel: "Buka Task Dashboard",
      phase: 1
    },
    {
      id: "absensi-tim",
      label: "Absensi Tim",
      desc: "Rekap kehadiran GPS seluruh tim outlet (GAWE).",
      icon: "clipboard-list",
      href: ATTENDANCE_URL,
      external: true,
      externalLabel: "Buka GAWE",
      phase: 1,
      ready: true
    },
    {
      id: "approval",
      label: "Approval Center",
      desc: "Setujui izin, request bahan, setoran & opname.",
      icon: "check-circle",
      href: "/approvals",
      phase: 3,
      ready: true
    },
    {
      id: "verifikasi-task",
      label: "Verifikasi Task",
      desc: "Cek bukti & sahkan task selesai.",
      icon: "shield-check",
      href: "/segera?fitur=Verifikasi%20Task",
      phase: 3
    },
    {
      id: "laporan-kendala",
      label: "Request & Form Center",
      desc: "Request bahan, izin, kasbon & kendala dari tim.",
      icon: "alert-triangle",
      href: "/inbox",
      phase: 2,
      ready: true
    },
    {
      id: "gudang",
      label: "Stok & Saldo",
      desc: "Stok bahan — peringatan otomatis beli & waspada.",
      icon: "package",
      href: "/inventory",
      phase: 5,
      ready: true
    },
    {
      id: "transfer-leader",
      label: "Transfer Stok",
      desc: "Request barang dari gudang pusat ke outlet.",
      icon: "package",
      href: "/inventory/transfers",
      phase: 5,
      ready: true
    },
    {
      id: "purchasing-leader",
      label: "Purchasing",
      desc: "Status belanja & PO.",
      icon: "receipt",
      href: "/purchasing",
      phase: 5,
      ready: true
    },
    {
      id: "sop-tim",
      label: "SOP Tim",
      desc: "Panduan kerja & siapa sudah baca.",
      icon: "book-open",
      href: "/sop",
      phase: 2,
      ready: true
    },
    {
      id: "kds-leader",
      label: "KDS Outlet",
      desc: "Monitor antrian dapur & bar.",
      icon: "package",
      href: "/kds",
      phase: 7,
      ready: true
    },
    {
      id: "pos-kasir-leader",
      label: "POS Outlet",
      desc: "Monitor penjualan & shift kasir outlet.",
      icon: "receipt",
      href: "/pos",
      phase: 7,
      ready: true
    },
    {
      id: "pos-settings-leader",
      label: "Pengaturan Kasir",
      desc: "Printer struk, auto-print, modal awal counter.",
      icon: "receipt",
      href: "/settings/pos",
      phase: 7,
      ready: true
    },
    {
      id: "library-leader",
      label: "Menu & Product Library",
      desc: "Kelola menu POS — foto, harga, kategori (seperti Moka).",
      icon: "book-open",
      href: "/library/products",
      phase: 7,
      ready: true
    },
    {
      id: "qr-tim",
      label: "Cetak QR",
      desc: "QR shortcut form untuk ditempel di area.",
      icon: "file-text",
      href: "/qr",
      phase: 2,
      ready: true
    },
    {
      id: "evaluasi-staff",
      label: "Evaluasi Staf",
      desc: "Aktivitas laporan tim di outlet.",
      icon: "graduation-cap",
      href: "/reports/outlet",
      phase: 4,
      ready: true
    }
  ]
};

const ADMIN: RoleConfig = {
  role: "admin",
  title: "Admin / Keuangan",
  tagline: "Payroll, kas, nota, dan rekap keuangan.",
  menu: [
    {
      id: "approval",
      label: "Approval Center",
      desc: "Setoran kasir & approval keuangan.",
      icon: "check-circle",
      href: "/approvals",
      phase: 3,
      ready: true
    },
    {
      id: "inbox",
      label: "Request & Form Center",
      desc: "Semua request & laporan.",
      icon: "inbox",
      href: "/inbox",
      phase: 2,
      ready: true
    },
    {
      id: "gawe-admin",
      label: "GAWE / Presensi",
      desc: "Absensi harian GPS — sumber data kehadiran karyawan.",
      icon: "clipboard-list",
      href: ATTENDANCE_URL,
      external: true,
      externalLabel: "Buka GAWE",
      phase: 1,
      ready: true
    },
    {
      id: "payroll",
      label: "Payroll & Slip Gaji",
      desc: "Input gaji & terbitkan slip (rahasia).",
      icon: "banknote",
      href: "/segera?fitur=Payroll%20%26%20Slip%20Gaji",
      phase: 6,
      sensitive: true
    },
    {
      id: "kas",
      label: "Kas Masuk & Keluar",
      desc: "Catat kas masuk dan kas keluar.",
      icon: "wallet",
      href: "/finance",
      phase: 6,
      ready: true
    },
    {
      id: "pengeluaran",
      label: "Pengeluaran",
      desc: "Rekap pengeluaran operasional.",
      icon: "receipt",
      href: "/finance/ledger",
      phase: 6,
      ready: true
    },
    {
      id: "upload-nota",
      label: "Upload Nota",
      desc: "Unggah nota belanja & bukti bayar.",
      icon: "upload",
      href: "/segera?fitur=Upload%20Nota",
      phase: 6
    },
    {
      id: "pos-admin",
      label: "POS Kasir",
      desc: "Akses POS lintas outlet F&B.",
      icon: "receipt",
      href: "/pos",
      phase: 7,
      ready: true
    },
    {
      id: "gudang-admin",
      label: "Stok & Saldo",
      desc: "Stok bahan — peringatan otomatis beli & waspada.",
      icon: "package",
      href: "/inventory",
      phase: 5,
      ready: true
    },
    {
      id: "transfer-admin",
      label: "Transfer Stok",
      desc: "Kirim barang gudang → outlet (tanpa approval owner).",
      icon: "package",
      href: "/inventory/transfers",
      phase: 5,
      ready: true
    },
    {
      id: "inventory-data-admin",
      label: "Kelola Data",
      desc: "Kelola master bahan, supplier, dan mutasi stok.",
      icon: "package",
      href: "/inventory/data",
      phase: 5,
      ready: true
    },
    {
      id: "purchasing-admin",
      label: "Purchasing",
      desc: "PO, supplier, penerimaan barang.",
      icon: "receipt",
      href: "/purchasing",
      phase: 5,
      ready: true
    },
    {
      id: "rekap",
      label: "Rekap Keuangan",
      desc: "Ringkasan kas & pengeluaran.",
      icon: "bar-chart-3",
      href: "/finance",
      phase: 6,
      ready: true
    },
    {
      id: "settings-accounts-admin",
      label: "Kelola Staf",
      desc: "Buat akun HP + PIN untuk tim.",
      icon: "users",
      href: "/settings/accounts",
      phase: 3,
      ready: true
    },
    {
      id: "settings-pins-admin",
      label: "PIN Kasir Tablet",
      desc: "PIN login di tablet counter POS.",
      icon: "shield-check",
      href: "/settings/pins",
      phase: 3,
      ready: true
    },
    {
      id: "settings-pos-admin",
      label: "Pengaturan Kasir",
      desc: "Printer struk & konfigurasi counter POS.",
      icon: "receipt",
      href: "/settings/pos",
      phase: 7,
      ready: true
    },
    {
      id: "library-admin",
      label: "Menu & Product Library",
      desc: "Kelola menu jualan lintas outlet — foto, harga, kategori.",
      icon: "book-open",
      href: "/library/products",
      phase: 7,
      ready: true
    },
    {
      id: "settings-inventory-closing-admin",
      label: "Opname Closing KDS",
      desc: "Atur produk wajib opname saat closing malam (marinasi, prep).",
      icon: "clipboard-list",
      href: "/settings/inventory-closing",
      phase: 5,
      ready: true
    },
    {
      id: "settings-system-admin",
      label: "System & Deployment",
      desc: "Checklist deploy Vercel, cron jam sepi, health check.",
      icon: "layout-dashboard",
      href: "/settings/system",
      phase: 3,
      ready: true
    },
    {
      id: "settings-audit-admin",
      label: "Audit Log",
      desc: "Riwayat aksi sensitif void, diskon, shift, inventori.",
      icon: "clipboard-list",
      href: "/settings/audit",
      phase: 3,
      ready: true
    }
  ]
};

const OWNER: RoleConfig = {
  role: "owner",
  title: "Owner",
  tagline: "Lihat semua, putuskan yang penting.",
  menu: [
    {
      id: "owner-report",
      label: "Dashboard Outlet",
      desc: "Ringkasan operasional & keputusan hari ini.",
      icon: "file-text",
      href: "/reports/owner",
      phase: 4,
      ready: true,
      group: "operasional"
    },
    {
      id: "semua-request",
      label: "Request & Form Center",
      desc: "Semua request masuk — bahan, izin, kasbon, waste, dll.",
      icon: "inbox",
      href: "/inbox",
      phase: 2,
      ready: true,
      group: "operasional"
    },
    {
      id: "semua-approval",
      label: "Approval Center",
      desc: "Approval yang menunggu keputusanmu.",
      icon: "check-circle",
      href: "/approvals",
      phase: 3,
      ready: true,
      group: "operasional"
    },
    {
      id: "gawe-owner",
      label: "GAWE / Presensi",
      desc: "Absensi harian GPS lintas tim & outlet.",
      icon: "clipboard-list",
      href: ATTENDANCE_URL,
      external: true,
      externalLabel: "Buka GAWE",
      phase: 1,
      ready: true,
      group: "operasional"
    },
    {
      id: "semua-task",
      label: "Task Center",
      desc: "Seluruh task lintas outlet.",
      icon: "list-checks",
      href: TASK_DASHBOARD_URL,
      external: true,
      externalLabel: "Buka Task Dashboard",
      phase: 1,
      group: "operasional"
    },
    {
      id: "pos-owner",
      label: "POS & Sales",
      desc: "Monitor POS lintas outlet F&B.",
      icon: "receipt",
      href: "/pos",
      phase: 7,
      ready: true,
      group: "sales"
    },
    {
      id: "member-owner",
      label: "Member & Loyalty",
      desc: "Member aktif, poin beredar, biaya promo, efektivitas.",
      icon: "users",
      href: "/reports/loyalty",
      phase: 7,
      ready: true,
      group: "sales"
    },
    {
      id: "rating-report",
      label: "Rating Report",
      desc: "Rating & keluhan pelanggan per outlet.",
      icon: "star",
      href: "/reports/ratings",
      phase: 4,
      ready: true,
      group: "sales"
    },
    {
      id: "stok-kritis",
      label: "Stok & Saldo",
      desc: "Bahan perlu beli atau waspada — update otomatis.",
      icon: "package",
      href: "/inventory",
      phase: 5,
      ready: true,
      group: "gudang"
    },
    {
      id: "transfer-owner",
      label: "Transfer Stok",
      desc: "Monitor request & pengiriman gudang → outlet.",
      icon: "package",
      href: "/inventory/transfers",
      phase: 5,
      ready: true,
      group: "gudang"
    },
    {
      id: "inventory-data-owner",
      label: "Kelola Data",
      desc: "Kelola master bahan, supplier, dan mutasi stok.",
      icon: "package",
      href: "/inventory/data",
      phase: 5,
      ready: true,
      group: "gudang"
    },
    {
      id: "purchasing-owner",
      label: "Purchasing",
      desc: "PO, supplier, penerimaan barang.",
      icon: "receipt",
      href: "/purchasing",
      phase: 5,
      ready: true,
      group: "gudang"
    },
    {
      id: "settings-inventory-closing-owner",
      label: "Opname Closing KDS",
      desc: "Atur produk wajib opname saat closing malam (marinasi, prep).",
      icon: "clipboard-list",
      href: "/settings/inventory-closing",
      phase: 5,
      ready: true,
      group: "gudang"
    },
    {
      id: "kas-hari-ini",
      label: "Finance / Kas Hari Ini",
      desc: "Kas tersedia, masuk, keluar, free cash.",
      icon: "banknote",
      href: "/finance",
      phase: 6,
      ready: true,
      group: "hr-keuangan"
    },
    {
      id: "ai-direktur",
      label: "AI Direktur Operasional",
      desc: "Analisa & rekomendasi harian (advisor).",
      icon: "brain",
      href: "/ai",
      phase: 4,
      ready: true,
      group: "hr-keuangan"
    },
    {
      id: "settings-accounts-owner",
      label: "Kelola Staff",
      desc: "Buat akun HP + PIN untuk tim.",
      icon: "users",
      href: "/settings/accounts",
      phase: 3,
      ready: true,
      group: "sistem"
    },
    {
      id: "settings-pins",
      label: "PIN Kasir Tablet",
      desc: "PIN login di tablet counter POS.",
      icon: "shield-check",
      href: "/settings/pins",
      phase: 3,
      ready: true,
      group: "sistem"
    },
    {
      id: "settings-pos-owner",
      label: "Pengaturan Kasir",
      desc: "Printer struk & konfigurasi counter POS.",
      icon: "receipt",
      href: "/settings/pos",
      phase: 7,
      ready: true,
      group: "sistem"
    },
    {
      id: "library-owner",
      label: "Menu & Product Library",
      desc: "Kelola menu jualan lintas outlet — foto, harga, kategori.",
      icon: "book-open",
      href: "/library/products",
      phase: 7,
      ready: true,
      group: "sistem"
    },
    {
      id: "settings-system-owner",
      label: "System & Deployment",
      desc: "Checklist deploy Vercel, cron jam sepi, bookmark tablet.",
      icon: "layout-dashboard",
      href: "/settings/system",
      phase: 3,
      ready: true,
      group: "sistem"
    },
    {
      id: "settings-audit-owner",
      label: "Audit Log",
      desc: "Riwayat aksi sensitif void, diskon, shift, inventori.",
      icon: "clipboard-list",
      href: "/settings/audit",
      phase: 3,
      ready: true,
      group: "sistem"
    }
  ]
};

const CONFIGS: Record<Role, RoleConfig> = {
  staff: STAFF,
  leader: LEADER,
  admin: ADMIN,
  owner: OWNER
};

export function getRoleConfig(role: Role): RoleConfig {
  return CONFIGS[role];
}
