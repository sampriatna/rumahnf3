import { redirect } from "next/navigation";

import { UI_FLAGS } from "@/lib/ui-flags";

import { requirePosSession } from "@/lib/pos-auth";

import { resolvePosDrawerOutlet } from "@/lib/pos-page-common";

import {

  ensureMemberDepositReady,

  listMemberDepositTxns,

  listMembersWithDeposit,

  resolveMemberForDeposit

} from "@/lib/pos-member-deposit";

import { PosDrawerLayout } from "@/components/pos/PosDrawerLayout";

import { PosSubPageShell } from "@/components/pos/PosSubPageShell";

import { PosMemberDepositPanel } from "@/components/pos/PosMemberDepositPanel";



export default async function PosMemberDepositPage({

  searchParams

}: {

  searchParams: { outlet?: string; q?: string; member?: string; ok?: string; error?: string };

}) {

  const session = requirePosSession();

  if (!["leader", "admin", "owner"].includes(session.role)) {

    redirect(`/pos?outlet=${searchParams.outlet ?? session.outletId ?? ""}`);

  }



  await ensureMemberDepositReady();



  const { outletId, outlet, shift, ctx } = resolvePosDrawerOutlet(searchParams, session);

  const useDrawer = UI_FLAGS.posLayoutV2 && UI_FLAGS.posDrawerNavV1;



  const selected =

    resolveMemberForDeposit({

      customerId: searchParams.member,

      memberCode: searchParams.q

    }) ?? undefined;



  const members = listMembersWithDeposit(searchParams.q);

  const txns = selected ? listMemberDepositTxns(selected.id) : [];



  const body = (

    <PosMemberDepositPanel

      outletId={outletId}

      shiftId={shift?.id}

      members={members}

      selected={selected}

      txns={txns}

      q={searchParams.q}

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

      title="Member Deposit"

    >

      {body}

    </PosSubPageShell>

  );

}

