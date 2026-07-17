import type { ReactNode } from "react";

import type { PosDrawerContext } from "@/lib/pos-drawer-context";

import { PosDrawerProvider, PosDrawerMobileTrigger } from "./PosDrawerNav";

import { PosGlobalHeader } from "./PosGlobalHeader";

import { PosSyncBanner } from "./PosSyncBanner";

import { PosDeviceBootstrap } from "./PosDeviceBootstrap";



export function PosDrawerLayout({

  ctx,

  orderCount,

  shiftTotal,

  hideNav,

  children

}: {

  ctx: PosDrawerContext;

  orderCount?: number;

  shiftTotal?: number;

  hideNav?: boolean;

  children: ReactNode;

}) {

  const main = (

    <>

      <PosDeviceBootstrap />

      <PosGlobalHeader

        ctx={ctx}

        orderCount={orderCount}

        shiftTotal={shiftTotal}

        menuToggle={hideNav ? undefined : <PosDrawerMobileTrigger />}

      />

      <PosSyncBanner pendingCount={ctx.pendingSync} outletId={ctx.outletId} />

      <div className="flex min-h-0 flex-1 flex-col">{children}</div>

    </>

  );



  if (hideNav) {

    return <div className="pos-drawer-shell flex min-h-screen flex-col bg-surface">{main}</div>;

  }



  return (

    <PosDrawerProvider

      outletId={ctx.outletId}

      shiftId={ctx.shift?.id}

      userRole={ctx.userRole}

      hasFloor={ctx.hasFloor}

      onlinePending={ctx.onlinePending}

      posOnlyStaff={ctx.posOnlyStaff}

    >

      {main}

    </PosDrawerProvider>

  );

}

