import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getSession } from "@/lib/session";
import { StaffPage } from "@/components/staff/StaffPage";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { formatRp } from "@/lib/finance";
import {
  getPayslipForSessionAsync,
  payslipNetPay,
  payslipTotalDeductions,
  payslipTotalEarnings
} from "@/lib/payroll";

export default async function SlipGajiDetailPage({ params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) redirect("/login");

  const slip = await getPayslipForSessionAsync(params.id, session);
  if (!slip) notFound();

  const earnings = slip.lines.filter((l) => l.type === "earning");
  const deductions = slip.lines.filter((l) => l.type === "deduction");
  const totalEarnings = payslipTotalEarnings(slip);
  const totalDeductions = payslipTotalDeductions(slip);
  const net = payslipNetPay(slip);

  return (
    <StaffPage>
      <StaffHeader
        title={`Slip Gaji — ${slip.periodLabel}`}
        subtitle={slip.userName}
        backHref="/staff/slip-gaji"
      />

      <div className="staff-card overflow-hidden">
        <div className="staff-hero px-5 py-4 text-white">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gold-300">Rumah NF3</p>
          <h2 className="text-xl font-black">Slip Gaji {slip.periodLabel}</h2>
          <p className="mt-1 text-sm text-slate-300">
            {slip.userName}
            {slip.outletName ? ` · ${slip.outletName}` : ""}
          </p>
          <p className="text-xs text-slate-400">
            Periode {new Date(slip.periodStart).toLocaleDateString("id-ID")} –{" "}
            {new Date(slip.periodEnd).toLocaleDateString("id-ID")}
          </p>
        </div>

        <div className="space-y-6 p-5">
          <section>
            <h3 className="staff-section-title mb-2">Pendapatan</h3>
            <dl className="space-y-2">
              {earnings.map((line) => (
                <div key={line.label} className="flex justify-between text-sm">
                  <dt className="text-slate-600">{line.label}</dt>
                  <dd className="font-semibold text-slate-900">{formatRp(line.amount)}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm font-bold">
              <span>Subtotal pendapatan</span>
              <span>{formatRp(totalEarnings)}</span>
            </div>
          </section>

          {deductions.length > 0 && (
            <section>
              <h3 className="staff-section-title mb-2">Potongan</h3>
              <dl className="space-y-2">
                {deductions.map((line) => (
                  <div key={line.label} className="flex justify-between text-sm">
                    <dt className="text-slate-600">{line.label}</dt>
                    <dd className="font-semibold text-rose-700">− {formatRp(line.amount)}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-2 flex justify-between border-t border-slate-100 pt-2 text-sm font-bold text-rose-800">
                <span>Subtotal potongan</span>
                <span>− {formatRp(totalDeductions)}</span>
              </div>
            </section>
          )}

          <div className="rounded-xl bg-emerald-50 px-4 py-4 ring-1 ring-emerald-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900">Gaji bersih diterima</span>
              <span className="text-2xl font-black text-emerald-800">{formatRp(net)}</span>
            </div>
          </div>

          {slip.note && (
            <p className="rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">{slip.note}</p>
          )}

          <p className="flex items-start gap-2 text-xs text-slate-500">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Dokumen ini hanya untuk {slip.userName}. Screenshot & sebar luas dilarang.
          </p>
        </div>
      </div>
    </StaffPage>
  );
}
