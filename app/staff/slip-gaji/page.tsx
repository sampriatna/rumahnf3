import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Lock, Wallet } from "lucide-react";
import { getSession } from "@/lib/session";
import { StaffPage } from "@/components/staff/StaffPage";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { formatRp } from "@/lib/finance";
import { listPayslipsForUserAsync, payslipNetPay } from "@/lib/payroll";

export default async function SlipGajiPage() {
  const session = getSession();
  if (!session) redirect("/login");

  const slips = await listPayslipsForUserAsync(session.sub);

  return (
    <StaffPage>
      <StaffHeader
        title="Slip Gaji Saya"
        subtitle="Hanya kamu yang bisa melihat slip ini — jangan bagikan ke orang lain."
      />

      <p className="staff-callout-info mb-6 border-rose-200/80 bg-rose-50/90 text-rose-800">
        <Lock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          Data gaji bersifat <strong>rahasia</strong>. Ada pertanyaan? Hubungi Admin Keuangan, bukan lewat chat
          grup.
        </span>
      </p>

      {slips.length === 0 ? (
        <div className="staff-empty">
          <Wallet className="h-8 w-8 text-slate-300" aria-hidden />
          <p className="font-semibold text-slate-700">Belum ada slip gaji</p>
          <p className="text-sm">
            Slip bulan ini akan muncul setelah Admin Keuangan menerbitkannya (biasanya tanggal 5).
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {slips.map((slip) => {
            const net = payslipNetPay(slip);
            return (
              <Link key={slip.id} href={`/staff/slip-gaji/${slip.id}`} className="staff-card-interactive block p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-navy-900">{slip.periodLabel}</h3>
                    <p className="text-xs text-slate-500">
                      {slip.outletName ?? "—"}
                      {slip.publishedAt
                        ? ` · Terbit ${new Date(slip.publishedAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}`
                        : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Gaji bersih</p>
                    <p className="text-xl font-black text-emerald-700">{formatRp(net)}</p>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-navy-700">
                  Lihat detail
                  <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </StaffPage>
  );
}
