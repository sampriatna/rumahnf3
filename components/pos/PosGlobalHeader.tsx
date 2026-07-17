import type { ReactNode } from "react";

import { formatRp } from "@/lib/finance";

import type { PosDrawerContext } from "@/lib/pos-drawer-context";

import { PosConnectivityBadge } from "./PosConnectivityBadge";



export function PosGlobalHeader({

  ctx,

  orderCount,

  shiftTotal,

  menuToggle

}: {

  ctx: PosDrawerContext;

  orderCount?: number;

  shiftTotal?: number;

  menuToggle?: ReactNode;

}) {

  const shiftOpen = Boolean(ctx.shift);

  const shiftLabel = ctx.shift?.shiftLabel;



  return (

    <header className="pos-global-header shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">

      <div className="flex flex-wrap items-start justify-between gap-3">

        <div className="flex min-w-0 items-start gap-3">

          {menuToggle}

          <div className="min-w-0">

            <h1 className="truncate text-lg font-black text-navy-900">{ctx.outletName}</h1>

            <p className="truncate text-xs text-slate-600">

              <span className="font-semibold text-navy-800">{ctx.userName}</span>

              {" · "}

              {shiftOpen ? (

                <>

                  Shift <span className="font-bold">{shiftLabel}</span>

                  {orderCount != null && (

                    <>

                      {" "}

                      · {orderCount} pesanan

                      {shiftTotal != null && (

                        <>

                          {" "}

                          · <span className="font-bold text-navy-800">{formatRp(shiftTotal)}</span>

                        </>

                      )}

                    </>

                  )}

                </>

              ) : (

                <span className="font-bold text-amber-700">Shift belum dibuka</span>

              )}

            </p>

          </div>

        </div>

        <div className="flex shrink-0 items-center gap-2">

          <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-bold text-slate-600">

            {ctx.deviceLabel}

            <span className="text-slate-300">|</span>

            <PosConnectivityBadge />

          </span>

        </div>

      </div>

    </header>

  );

}

