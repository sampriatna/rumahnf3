import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getCashDrawerSummary } from "@/lib/pos-service";
import { listOutletExpenses } from "@/lib/pos-outlet-expense";
import { UI_FLAGS } from "@/lib/ui-flags";
import { requirePosSession } from "@/lib/pos-auth";
import { resolvePosDrawerOutlet } from "@/lib/pos-page-common";
import { PosDrawerLayout } from "@/components/pos/PosDrawerLayout";
import { PosSubPageShell } from "@/components/pos/PosSubPageShell";
import { PosSubPageAlerts } from "@/components/pos/PosSubPageAlerts";
import { OutletExpenseForm } from "@/components/pos/OutletExpenseForm";
import { OutletExpenseList } from "@/components/pos/OutletExpenseList";

export default function PosExpensesPage({
  searchParams
}: {
  searchParams: { outlet?: string; shift?: string; ok?: string; error?: string };
}) {
  const session = requirePosSession();
  const { outletId, outlet, shift, ctx } = resolvePosDrawerOutlet(searchParams, session);
  const useDrawer = UI_FLAGS.posLayoutV2 && UI_FLAGS.posDrawerNavV1;

  const activeShift = searchParams.shift
    ? getCashDrawerSummary(searchParams.shift)?.shift
    : shift;

  if (!activeShift || activeShift.status !== "open") {
    redirect(`/pos/shift?outlet=${outletId}`);
  }

  const expenses = listOutletExpenses(activeShift.id);
  const drawer = getCashDrawerSummary(activeShift.id)!;

  const body = (
    <div className="space-y-4">
      <PosSubPageAlerts ok={searchParams.ok} error={searchParams.error} />
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Pengeluaran outlet mengurangi <strong>Total Kas Akhir</strong> shift ini. Total saat ini:{" "}
        <strong>{drawer.outletExpensesTotal.toLocaleString("id-ID")} Rp</strong>
      </div>
      <section>
        <h2 className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-500">
          Pengeluaran Outlet Hari Ini
        </h2>
        <OutletExpenseList expenses={expenses} />
      </section>
      <section className="pos-panel p-5">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-navy-900">
          <Plus className="h-4 w-4" aria-hidden />
          Tambah Pengeluaran
        </h2>
        <OutletExpenseForm outletId={outletId} shiftId={activeShift.id} />
      </section>
      <Link
        href={`/pos/shift?outlet=${outletId}&shift=${activeShift.id}`}
        className="inline-block text-xs font-bold text-navy-700 underline"
      >
        ← Kembali ke Ganti Shift / Hari
      </Link>
    </div>
  );

  if (useDrawer) {
    return (
      <PosDrawerLayout ctx={ctx}>
        <main className="mx-auto w-full max-w-lg flex-1 px-4 py-6">{body}</main>
      </PosDrawerLayout>
    );
  }

  return (
    <PosSubPageShell
      outletId={outletId}
      outletName={outlet.name}
      shiftLabel={activeShift.shiftLabel}
      title="Pengeluaran Outlet"
      subtitle="mempengaruhi Total Kas Akhir"
    >
      <div className="pos-panel p-6">{body}</div>
    </PosSubPageShell>
  );
}
