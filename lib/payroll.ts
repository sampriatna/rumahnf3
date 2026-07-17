// Slip gaji per staf — data rahasia, hanya user pemilik yang boleh melihat.
// Produksi nanti: nf3.payroll + RLS auth.uid() = user_id (lihat supabase/schema.sql).

import { USERS } from "./mock-data";
import { outletDisplayName } from "./outlet-identity";

export type PayslipLine = {
  label: string;
  amount: number;
  type: "earning" | "deduction";
};

export type Payslip = {
  id: string;
  userId: string;
  userName: string;
  outletId?: string;
  outletName?: string;
  /** Contoh: "Mei 2026" */
  periodLabel: string;
  periodStart: string;
  periodEnd: string;
  status: "published" | "draft";
  publishedAt?: string;
  lines: PayslipLine[];
  /** Catatan HR / keuangan */
  note?: string;
};

function outletName(id?: string) {
  if (!id) return undefined;
  return outletDisplayName(id);
}

function netPay(slip: Payslip) {
  return slip.lines.reduce((sum, l) => sum + (l.type === "earning" ? l.amount : -l.amount), 0);
}

/** Demo slip — fallback bila Supabase kosong. */
export const DEMO_PAYSLIPS: Payslip[] = [
  {
    id: "ps-2026-05-aji",
    userId: "u-staff",
    userName: "Aji (Staf Dapur)",
    outletId: "kbu",
    outletName: outletName("kbu"),
    periodLabel: "Mei 2026",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    status: "published",
    publishedAt: "2026-06-05T08:00:00+07:00",
    lines: [
      { label: "Gaji Pokok", amount: 3_200_000, type: "earning" },
      { label: "Tunjangan Makan", amount: 450_000, type: "earning" },
      { label: "Tunjangan Transport", amount: 300_000, type: "earning" },
      { label: "Lembur (12 jam)", amount: 480_000, type: "earning" },
      { label: "Potongan Kasbon (1/2)", amount: 500_000, type: "deduction" },
      { label: "Potongan Telat (2x)", amount: 50_000, type: "deduction" }
    ],
    note: "Kasbon diajukan 10 Apr — sisa 1x potongan di slip Juni."
  },
  {
    id: "ps-2026-04-aji",
    userId: "u-staff",
    userName: "Aji (Staf Dapur)",
    outletId: "kbu",
    outletName: outletName("kbu"),
    periodLabel: "April 2026",
    periodStart: "2026-04-01",
    periodEnd: "2026-04-30",
    status: "published",
    publishedAt: "2026-05-05T08:00:00+07:00",
    lines: [
      { label: "Gaji Pokok", amount: 3_200_000, type: "earning" },
      { label: "Tunjangan Makan", amount: 450_000, type: "earning" },
      { label: "Tunjangan Transport", amount: 300_000, type: "earning" },
      { label: "Bonus Target Outlet", amount: 200_000, type: "earning" },
      { label: "Potongan Kasbon (1/2)", amount: 500_000, type: "deduction" }
    ]
  },
  {
    id: "ps-2026-05-siti",
    userId: "u-staff-kasir",
    userName: "Siti (Kasir)",
    outletId: "kbu",
    outletName: outletName("kbu"),
    periodLabel: "Mei 2026",
    periodStart: "2026-05-01",
    periodEnd: "2026-05-31",
    status: "published",
    publishedAt: "2026-06-05T08:00:00+07:00",
    lines: [
      { label: "Gaji Pokok", amount: 3_400_000, type: "earning" },
      { label: "Tunjangan Makan", amount: 450_000, type: "earning" },
      { label: "Tunjangan Transport", amount: 300_000, type: "earning" },
      { label: "Insentif Kasir", amount: 350_000, type: "earning" }
    ]
  }
];

/** Slip yang sudah dipublish untuk satu staf — urut terbaru dulu (in-memory fallback). */
export function listPayslipsForUser(userId: string): Payslip[] {
  return DEMO_PAYSLIPS.filter((p) => p.userId === userId && p.status === "published").sort((a, b) =>
    b.periodStart.localeCompare(a.periodStart)
  );
}

/** Muat slip dari Supabase, fallback demo. */
export async function listPayslipsForUserAsync(userId: string): Promise<Payslip[]> {
  const { pullPayroll } = await import("./db/payroll-repo");
  const snap = await pullPayroll();
  const rows = snap?.payslips ?? DEMO_PAYSLIPS;
  return rows
    .filter((p) => p.userId === userId && p.status === "published")
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
}

/** Ambil slip dengan cek akses: staf hanya milik sendiri; owner/admin semua (in-memory). */
export function getPayslipForSession(
  slipId: string,
  session: { sub: string; role: string; isSuperAdmin?: boolean }
): Payslip | null {
  const slip = DEMO_PAYSLIPS.find((p) => p.id === slipId);
  if (!slip || slip.status !== "published") return null;

  const isHr = session.role === "owner" || session.role === "admin" || session.isSuperAdmin;
  if (!isHr && slip.userId !== session.sub) return null;

  return slip;
}

/** Ambil slip dari Supabase dengan cek akses session. */
export async function getPayslipForSessionAsync(
  slipId: string,
  session: { sub: string; role: string; isSuperAdmin?: boolean }
): Promise<Payslip | null> {
  const { pullPayroll } = await import("./db/payroll-repo");
  const snap = await pullPayroll();
  const slips = snap?.payslips ?? DEMO_PAYSLIPS;
  const slip = slips.find((p) => p.id === slipId);
  if (!slip || slip.status !== "published") return null;

  const isHr = session.role === "owner" || session.role === "admin" || session.isSuperAdmin;
  if (!isHr && slip.userId !== session.sub) return null;

  return slip;
}

export function payslipNetPay(slip: Payslip) {
  return netPay(slip);
}

export function payslipTotalEarnings(slip: Payslip) {
  return slip.lines.filter((l) => l.type === "earning").reduce((s, l) => s + l.amount, 0);
}

export function payslipTotalDeductions(slip: Payslip) {
  return slip.lines.filter((l) => l.type === "deduction").reduce((s, l) => s + l.amount, 0);
}

/** Nama tampilan staf dari session.sub */
export function payslipUserDisplayName(userId: string) {
  return USERS.find((u) => u.id === userId)?.name ?? "Staf";
}
