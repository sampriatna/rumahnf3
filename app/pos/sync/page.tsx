import { redirect } from "next/navigation";

import { UI_FLAGS } from "@/lib/ui-flags";

import { requirePosSession } from "@/lib/pos-auth";

import { resolvePosDrawerOutlet } from "@/lib/pos-page-common";

import { readPosDeviceCookie } from "@/lib/pos-device-cookie";

import { getSyncCategorySummary } from "@/lib/pos-sync-queue";

import { PosDrawerLayout } from "@/components/pos/PosDrawerLayout";

import { PosSubPageShell } from "@/components/pos/PosSubPageShell";

import { PosSyncPanel } from "@/components/pos/PosSyncPanel";



export default function PosSyncPage({

  searchParams

}: {

  searchParams: { outlet?: string; ok?: string; error?: string };

}) {

  const session = requirePosSession();

  const { outletId, outlet, shift, ctx } = resolvePosDrawerOutlet(searchParams, session);

  const useDrawer = UI_FLAGS.posLayoutV2 && UI_FLAGS.posDrawerNavV1;

  const summary = getSyncCategorySummary(outletId);

  const deviceId = readPosDeviceCookie();



  const body = (

    <PosSyncPanel

      outletId={outletId}

      deviceId={deviceId}

      summary={summary}

      ok={searchParams.ok}

      error={searchParams.error}

    />

  );



  if (useDrawer) {

    return (

      <PosDrawerLayout ctx={ctx}>

        <main className="flex-1 px-4 py-6">{body}</main>

      </PosDrawerLayout>

    );

  }



  if (!shift) redirect(`/pos?outlet=${outletId}`);



  return (

    <PosSubPageShell

      outletId={outletId}

      outletName={outlet.name}

      shiftLabel={shift.shiftLabel}

      title="Sinkronkan Penjualan"

    >

      {body}

    </PosSubPageShell>

  );

}

