import Link from "next/link";

import { redirect } from "next/navigation";

import { formatRp } from "@/lib/finance";

import { getCashDrawerSummary } from "@/lib/pos-service";

import { getStoreDayState, isStoreClosedForDay } from "@/lib/pos-store-day";

import { listOutletExpenses } from "@/lib/pos-outlet-expense";

import { closeStoreDayAction } from "@/app/pos-actions";

import { UI_FLAGS } from "@/lib/ui-flags";

import { requirePosSession } from "@/lib/pos-auth";

import { resolvePosDrawerOutlet } from "@/lib/pos-page-common";

import { PosDrawerLayout } from "@/components/pos/PosDrawerLayout";

import { PosSubPageShell } from "@/components/pos/PosSubPageShell";

import { PosSubPageAlerts } from "@/components/pos/PosSubPageAlerts";

import { OutletExpenseList } from "@/components/pos/OutletExpenseList";

import { DoorClosed, Wallet, Receipt, Store, PlusCircle } from "lucide-react";



const STORE_DAY_ROLES = ["leader", "admin", "owner"];



export default function PosShiftHubPage({

  searchParams

}: {

  searchParams: { outlet?: string; shift?: string; ok?: string; error?: string };

}) {

  const session = requirePosSession();

  const { outletId, outlet, shift, ctx } = resolvePosDrawerOutlet(searchParams, session);

  const useDrawer = UI_FLAGS.posLayoutV2 && UI_FLAGS.posDrawerNavV1;

  const storeDay = getStoreDayState(outletId);

  const canManageStore = STORE_DAY_ROLES.includes(session.role);



  if (!shift) {

    const noShiftBody = (

      <div className="mx-auto max-w-lg space-y-4">

        <PosSubPageAlerts error={searchParams.error} ok={searchParams.ok} />

        <div className="pos-panel p-6 text-center">

          <h2 className="text-lg font-black text-navy-900">Tidak ada shift aktif</h2>

          <p className="mt-2 text-sm text-slate-600">

            {isStoreClosedForDay(outletId)

              ? "Toko ditutup — buka toko dulu sebelum shift baru."

              : "Buka shift untuk mulai penjualan atau tutup toko setelah semua shift selesai."}

          </p>

          {!isStoreClosedForDay(outletId) && (

            <Link href={`/pos?outlet=${outletId}`} className="pos-cta-primary mt-4 inline-block">

              Buka Shift

            </Link>

          )}

        </div>

        {canManageStore && !isStoreClosedForDay(outletId) && (

          <form action={closeStoreDayAction} className="pos-panel p-5">

            <div className="flex items-start gap-3">

              <Store className="h-5 w-5 shrink-0 text-rose-600" aria-hidden />

              <div className="flex-1">

                <h3 className="font-bold text-navy-900">Tutup Toko</h3>

                <p className="mt-1 text-xs text-slate-600">

                  Kunci penjualan hari ini. Pastikan tidak ada shift terbuka.

                </p>

                <input type="hidden" name="outletId" value={outletId} />

                <button type="submit" className="mt-3 w-full rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-bold text-rose-800 transition hover:bg-rose-100">

                  Tutup Toko Hari Ini

                </button>

              </div>

            </div>

          </form>

        )}

        {storeDay.status === "closed" && storeDay.closedBy && (

          <p className="text-center text-xs text-slate-500">

            Ditutup oleh {storeDay.closedBy}

          </p>

        )}

      </div>

    );



    if (useDrawer) {

      return (

        <PosDrawerLayout ctx={ctx}>

          <main className="flex-1 px-4 py-6">{noShiftBody}</main>

        </PosDrawerLayout>

      );

    }

    redirect(`/pos?outlet=${outletId}`);

  }



  const drawer = getCashDrawerSummary(shift.id)!;

  const expenses = listOutletExpenses(shift.id);

  const openedAt = new Date(shift.openedAt).toLocaleString("id-ID", {

    day: "numeric",

    month: "short",

    hour: "2-digit",

    minute: "2-digit"

  });



  const auditCards = [

    { label: "1. Kas Awal", value: shift.openingFloat },

    { label: "2. Pembayaran Tunai", value: shift.systemCashTotal ?? 0 },

    { label: "3. Pengeluaran Outlet", value: drawer.outletExpensesTotal, negative: true }

  ];



  const body = (

    <div className="mx-auto max-w-lg space-y-4">

      <PosSubPageAlerts error={searchParams.error} ok={searchParams.ok} />



      <div className="pos-panel p-5">

        <p className="text-xs font-bold uppercase text-slate-500">Shift aktif</p>

        <h2 className="mt-1 text-xl font-black text-navy-900">

          {outlet.name} · {shift.shiftLabel}

        </h2>

        <p className="mt-1 text-sm text-slate-600">

          Kasir: <span className="font-semibold">{shift.openedBy ?? session.name}</span> · Mulai {openedAt}

        </p>

      </div>



      <div className="space-y-2">

        {auditCards.map((c) => (

          <div key={c.label} className="pos-panel flex items-center justify-between px-4 py-3">

            <span className="text-sm font-semibold text-slate-700">{c.label}</span>

            <span className={`text-lg font-black ${c.negative ? "text-rose-700" : "text-navy-900"}`}>

              {c.negative ? "−" : ""}

              {formatRp(c.value)}

            </span>

          </div>

        ))}

      </div>



      <div className="pos-total-box text-center">

        <p className="text-xs font-bold uppercase text-slate-500">4. Total Kas Akhir</p>

        <p className="mt-1 text-3xl font-black text-navy-900">{formatRp(drawer.totalKasAkhir)}</p>

        <p className="mt-1 text-xs text-slate-500">Kas awal + tunai − pengeluaran outlet</p>

        {(drawer.payIn > 0 || drawer.payOut > 0) && (

          <p className="mt-2 text-[11px] text-slate-500">

            Perkiraan laci fisik (± pay in/out): {formatRp(drawer.expectedCash)}

          </p>

        )}

      </div>



      <div className="pos-panel p-4">

        <div className="mb-3 flex items-center justify-between gap-2">

          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">

            Pengeluaran Outlet

          </h3>

          <Link

            href={`/pos/expenses?outlet=${outletId}&shift=${shift.id}`}

            className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 underline"

          >

            <PlusCircle className="h-3.5 w-3.5" aria-hidden />

            Kelola

          </Link>

        </div>

        <OutletExpenseList expenses={expenses.slice(0, 3)} />

        {expenses.length > 3 && (

          <Link

            href={`/pos/expenses?outlet=${outletId}&shift=${shift.id}`}

            className="mt-2 block text-center text-xs font-bold text-navy-700"

          >

            Lihat semua ({expenses.length}) →

          </Link>

        )}

      </div>



      <div className="grid gap-2">

        <Link

          href={`/pos/drawer?outlet=${outletId}&shift=${shift.id}`}

          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-navy-800 transition hover:border-gold-400"

        >

          <Wallet className="h-5 w-5 text-navy-600" aria-hidden />

          Kelola Laci Kas (Pay In / Out)

        </Link>

        <Link

          href={`/pos/close?outlet=${outletId}&shift=${shift.id}`}

          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-navy-800 transition hover:border-gold-400"

        >

          <DoorClosed className="h-5 w-5 text-navy-600" aria-hidden />

          Akhiri Shift

        </Link>

        <Link

          href={`/pos/reports?outlet=${outletId}`}

          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-navy-800 transition hover:border-gold-400"

        >

          <Receipt className="h-5 w-5 text-navy-600" aria-hidden />

          Cetak / Laporan Shift

        </Link>

      </div>



      <p className="text-center text-xs text-slate-500">

        Setelah shift ditutup, leader dapat menutup toko dari halaman ini.

      </p>

    </div>

  );



  if (useDrawer) {

    return (

      <PosDrawerLayout ctx={ctx}>

        <main className="flex-1 px-4 py-6">{body}</main>

      </PosDrawerLayout>

    );

  }



  return (

    <PosSubPageShell

      outletId={outletId}

      outletName={outlet.name}

      shiftLabel={shift.shiftLabel}

      title="Ganti Shift / Hari"

      width="md"

    >

      {body}

    </PosSubPageShell>

  );

}


