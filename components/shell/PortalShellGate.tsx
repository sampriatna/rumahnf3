import { headers } from "next/headers";
import type { ReactNode } from "react";
import { getSession } from "@/lib/session";
import { UI_FLAGS } from "@/lib/ui-flags";
import { shouldUsePortalShell, pageTitleFromPath } from "@/lib/portal-shell";
import {
  buildShellNav,
  buildShellShortcuts,
  canShowOutletSwitcher
} from "@/lib/nav-items";
import { listOutletRegistry, resolveOutletIdentity } from "@/lib/outlet-identity";
import { readShellOutletCookie } from "@/lib/shell-outlet";
import { AppShell } from "./AppShell";

function resolveActiveOutlet(
  session: NonNullable<ReturnType<typeof getSession>>,
  cookieValue?: string
): { slug: string | null; label: string } {
  if (session.role === "leader" && session.outletId) {
    const outlet = resolveOutletIdentity(session.outletId);
    return {
      slug: outlet?.slug ?? session.outletId,
      label: outlet ? `${outlet.code} — ${outlet.name}` : session.outletId
    };
  }

  if (canShowOutletSwitcher(session)) {
    if (!cookieValue || cookieValue === "all") {
      return { slug: null, label: "Semua Outlet" };
    }
    const outlet = resolveOutletIdentity(cookieValue);
    return {
      slug: outlet?.slug ?? cookieValue,
      label: outlet ? `${outlet.code} — ${outlet.name}` : cookieValue
    };
  }

  return { slug: null, label: "" };
}

export async function PortalShellGate({
  children
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  if (!UI_FLAGS.appShell) {
    return <>{children}</>;
  }

  const pathname = headers().get("x-pathname") ?? "";
  if (!shouldUsePortalShell(pathname)) {
    return <>{children}</>;
  }

  const session = getSession();
  if (!session || session.role === "staff") {
    return <>{children}</>;
  }

  const nav = buildShellNav(session);
  const shortcuts = buildShellShortcuts(session);
  const outlets = listOutletRegistry();
  const cookieValue = readShellOutletCookie();
  const { slug, label } = resolveActiveOutlet(session, cookieValue);

  return (
    <AppShell
      session={session}
      nav={nav}
      shortcuts={shortcuts}
      pageTitle={pageTitleFromPath(pathname)}
      outlets={outlets}
      activeOutletSlug={slug}
      activeOutletLabel={label}
    >
      {children}
    </AppShell>
  );
}
