import type { ReactNode } from "react";

import type { SessionPayload } from "@/lib/session";

import type { ShellNavItem, ShellShortcut } from "@/lib/nav-items";

import type { OutletIdentity } from "@/lib/outlet-identity";

import { ShellFrame } from "./ShellFrame";



export function AppShell({

  session,

  nav,

  shortcuts,

  pageTitle,

  outlets,

  activeOutletSlug,

  activeOutletLabel,

  children

}: {

  session: SessionPayload;

  nav: ShellNavItem[];

  shortcuts: ShellShortcut[];

  pageTitle: string;

  outlets: OutletIdentity[];

  activeOutletSlug: string | null;

  activeOutletLabel: string;

  children: ReactNode;

}) {

  return (

    <ShellFrame

      session={session}

      nav={nav}

      shortcuts={shortcuts}

      pageTitle={pageTitle}

      outlets={outlets}

      activeOutletSlug={activeOutletSlug}

      activeOutletLabel={activeOutletLabel}

    >

      {children}

    </ShellFrame>

  );

}

