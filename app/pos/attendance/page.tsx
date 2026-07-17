import { redirect } from "next/navigation";

import { UI_FLAGS } from "@/lib/ui-flags";

import { requirePosSession } from "@/lib/pos-auth";

import { resolvePosDrawerOutlet } from "@/lib/pos-page-common";

import {
  getOpenAttendance,
  listOutletAttendanceToday
} from "@/lib/pos-attendance";

import { PosDrawerLayout } from "@/components/pos/PosDrawerLayout";

import { PosSubPageShell } from "@/components/pos/PosSubPageShell";

import { PosAttendancePanel } from "@/components/pos/PosAttendancePanel";



export default function PosAttendancePage({

  searchParams

}: {

  searchParams: { outlet?: string; ok?: string; error?: string };

}) {

  const session = requirePosSession();

  const { outletId, outlet, shift, ctx } = resolvePosDrawerOutlet(searchParams, session);

  const useDrawer = UI_FLAGS.posLayoutV2 && UI_FLAGS.posDrawerNavV1;



  const myOpen = getOpenAttendance(session.sub, outletId);

  const todayRecords = listOutletAttendanceToday(outletId);



  const body = (

    <PosAttendancePanel

      outletId={outletId}

      userName={session.name}

      userRole={session.role}

      myOpen={myOpen}

      todayRecords={todayRecords}

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

      title="Absen"

    >

      {body}

    </PosSubPageShell>

  );

}

