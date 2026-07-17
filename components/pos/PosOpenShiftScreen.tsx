import { Banknote } from "lucide-react";

import { PosExitLink } from "./PosExitLink";

import { PosDrawerLayout } from "./PosDrawerLayout";

import { openShiftAction } from "@/app/pos-actions";

import type { PosDrawerContext } from "@/lib/pos-drawer-context";



export function PosOpenShiftScreen({

  outletId,

  outletName,

  registerId,

  defaultFloat,

  drawerCtx

}: {

  outletId: string;

  outletName: string;

  registerId: string;

  defaultFloat: number;

  drawerCtx?: PosDrawerContext;

}) {

  const form = (

    <div className="w-full max-w-md">

      {!drawerCtx && (

        <PosExitLink className="text-xs font-bold uppercase tracking-wide text-slate-400" />

      )}

      <div className={`pos-panel ${drawerCtx ? "" : "mt-4"} p-6`}>

        <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">

          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-800 text-gold-400">

            <Banknote className="h-6 w-6" aria-hidden />

          </span>

          <div>

            <h1 className="text-xl font-black text-navy-900">Buka Shift Kasir</h1>

            <p className="text-sm text-slate-600">{outletName}</p>

          </div>

        </div>

        <p className="mb-4 text-sm text-slate-600">

          Shift harus dibuka sebelum menerima pesanan. Modal awal laci akan dicatat di laporan

          kasir.

        </p>

        <form action={openShiftAction} className="grid gap-4">

          <input type="hidden" name="outletId" value={outletId} />

          <input type="hidden" name="registerId" value={registerId} />

          <div>

            <label htmlFor="shiftLabel" className="nf3-field-label">

              Sesi Shift

            </label>

            <select id="shiftLabel" name="shiftLabel" className="nf3-select mt-1 py-3 text-base font-semibold">

              <option value="Pagi">Pagi</option>

              <option value="Siang">Siang</option>

              <option value="Malam">Malam</option>

            </select>

          </div>

          <div>

            <label htmlFor="openingFloat" className="nf3-field-label">

              Modal Awal Laci (Rp)

            </label>

            <input

              id="openingFloat"

              name="openingFloat"

              type="number"

              defaultValue={defaultFloat}

              min={0}

              step={1000}

              className="nf3-input mt-1 py-3 text-base"

            />

          </div>

          <button type="submit" className="pos-cta-primary">

            Mulai Shift Kasir

          </button>

        </form>

      </div>

    </div>

  );



  if (drawerCtx) {

    return (

      <PosDrawerLayout ctx={drawerCtx}>

        <main className="flex flex-1 items-center justify-center px-5 py-10">{form}</main>

      </PosDrawerLayout>

    );

  }



  return (

    <div className="pos-shell flex min-h-screen flex-col items-center justify-center px-5 py-10">

      {form}

    </div>

  );

}


