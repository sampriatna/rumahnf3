// Tipe inti Rumah NF3.

export type Role = "staff" | "leader" | "admin" | "owner";

/** Fase berikutnya: pecah akses staf (kasir / dapur / gudang). Belum dipakai di RBAC. */
export type StaffCapability = "pos" | "kds" | "inventory" | "forms";

export const ROLES: Role[] = ["staff", "leader", "admin", "owner"];

export function isRole(value: string | null | undefined): value is Role {
  return value === "staff" || value === "leader" || value === "admin" || value === "owner";
}

// Fase tempat sebuah fitur direncanakan dibangun (untuk label "Segera" di UI).
export type Phase = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Nama ikon lucide-react. Dipetakan ke komponen di components/MenuCard.tsx.
export type IconName =
  | "clipboard-list"
  | "file-plus"
  | "book-open"
  | "inbox"
  | "wallet"
  | "life-buoy"
  | "store"
  | "users"
  | "check-circle"
  | "shield-check"
  | "alert-triangle"
  | "graduation-cap"
  | "layout-dashboard"
  | "list-checks"
  | "receipt"
  | "banknote"
  | "upload"
  | "bar-chart-3"
  | "package"
  | "star"
  | "brain"
  | "file-text";

/** Kelompok kartu di dashboard Owner (hanya dipakai role owner). */
export type DashboardMenuGroup =
  | "operasional"
  | "sales"
  | "gudang"
  | "hr-keuangan"
  | "sistem";

export type MenuItem = {
  id: string;
  /** Label bahasa lapangan, mis. "Tugas Saya", "Kirim Laporan". */
  label: string;
  /** Penjelasan singkat untuk staf gaptek. */
  desc: string;
  icon: IconName;
  /** Tujuan internal (mis. "/segera?fitur=...") atau eksternal bila `external`. */
  href: string;
  /** True jika membuka aplikasi lain (mis. Task Dashboard existing). */
  external?: boolean;
  /** Label badge untuk link eksternal (default: "Buka aplikasi eksternal"). */
  externalLabel?: string;
  /** Fase pengerjaan fitur ini. */
  phase: Phase;
  /** Sudah dibangun & bisa dibuka (jangan tampilkan label "Segera"). */
  ready?: boolean;
  /** Tandai fitur sensitif (mis. slip gaji) untuk styling/peringatan. */
  sensitive?: boolean;
  /** Pengelompokan kartu di dashboard Owner. */
  group?: DashboardMenuGroup;
};

export type RoleConfig = {
  role: Role;
  /** Nama tampilan role dalam bahasa Indonesia. */
  title: string;
  /** Kalimat sapaan/penjelasan singkat peran. */
  tagline: string;
  /** Daftar menu/ruang yang tampil di dashboard role ini. */
  menu: MenuItem[];
};
