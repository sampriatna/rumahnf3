"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { SessionPayload } from "@/lib/session";
import type { ShellNavItem, ShellShortcut } from "@/lib/nav-items";
import type { OutletIdentity } from "@/lib/outlet-identity";
import { shellLayout, spacing } from "@/lib/design-tokens";
import { Sidebar } from "./Sidebar";
import { TopNavigation } from "./TopNavigation";

export function ShellFrame({
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
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        items={nav}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopNavigation
          session={session}
          pageTitle={pageTitle}
          shortcuts={shortcuts}
          outlets={outlets}
          activeOutletSlug={activeOutletSlug}
          activeOutletLabel={activeOutletLabel}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className={`flex-1 overflow-auto ${spacing.pageX} ${spacing.pageY}`}>
          <div className={`mx-auto w-full ${shellLayout.contentMax}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}
