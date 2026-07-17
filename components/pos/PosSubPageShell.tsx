import Link from "next/link";

import type { ReactNode } from "react";

import { PosDrawerLayout } from "./PosDrawerLayout";

import type { PosDrawerContext } from "@/lib/pos-drawer-context";



export function PosSubPageShell({

  outletId,

  outletName,

  shiftLabel,

  title,

  subtitle,

  width = "md",

  actions,

  drawerCtx,

  children

}: {

  outletId: string;

  outletName: string;

  shiftLabel: string;

  title: string;

  subtitle?: string;

  width?: "md" | "lg" | "xl";

  actions?: ReactNode;

  drawerCtx?: PosDrawerContext;

  children: ReactNode;

}) {

  const maxW =

    width === "xl" ? "max-w-5xl" : width === "lg" ? "max-w-3xl" : "max-w-lg";



  const pageHeader = (

    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">

      <div className="min-w-0">

        {!drawerCtx && (

          <Link

            href={`/pos?outlet=${outletId}`}

            className="text-[10px] font-bold uppercase tracking-wide text-slate-400 transition hover:text-navy-700"

          >

            ← Kembali ke POS

          </Link>

        )}

        <h1 className={`font-black text-navy-900 ${drawerCtx ? "text-xl" : "mt-1 text-xl"}`}>

          {title}

        </h1>

        <p className="text-sm text-slate-600">

          {outletName} · Shift {shiftLabel}

          {subtitle ? ` · ${subtitle}` : ""}

        </p>

      </div>

      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}

    </div>

  );



  const main = (

    <main className={`mx-auto w-full flex-1 px-4 py-6 pb-24 ${maxW}`}>

      {pageHeader}

      {children}

    </main>

  );



  if (drawerCtx) {

    return <PosDrawerLayout ctx={drawerCtx}>{main}</PosDrawerLayout>;

  }



  return (

    <div className="pos-shell flex min-h-screen flex-col">

      <header className="shrink-0 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">

        <Link

          href={`/pos?outlet=${outletId}`}

          className="text-[10px] font-bold uppercase tracking-wide text-slate-400 transition hover:text-navy-700"

        >

          ← Kembali ke POS

        </Link>

        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">

          <div className="min-w-0">

            <h1 className="text-xl font-black text-navy-900">{title}</h1>

            <p className="text-sm text-slate-600">

              {outletName} · Shift {shiftLabel}

              {subtitle ? ` · ${subtitle}` : ""}

            </p>

          </div>

          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}

        </div>

      </header>

      <main className={`mx-auto w-full flex-1 px-4 py-6 pb-24 ${maxW}`}>{children}</main>

    </div>

  );

}



export function PosSubPageAction({

  href,

  label,

  children

}: {

  href: string;

  label: string;

  children?: ReactNode;

}) {

  return (

    <Link href={href} className="pos-toolbar-btn text-sm" title={label}>

      {children ?? label}

    </Link>

  );

}


