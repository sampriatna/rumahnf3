import { getRoleConfig } from "./rbac";
import { DASHBOARD_GROUP_LABELS, DASHBOARD_GROUP_ORDER } from "./dashboard-groups";
import type { DashboardMenuGroup, MenuItem, Role } from "./types";
import { posAppUrl, configuredKdsUrl } from "./subdomains";
import type { SessionPayload } from "./session";
import { isGlobalRole } from "./data-scope";
import { UI_FLAGS } from "./ui-flags";

export type ShellNavItem = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  icon: MenuItem["icon"];
  section?: string;
};

export type ShellShortcut = {
  id: string;
  label: string;
  href: string;
  external?: boolean;
  roles: Role[];
};

/** Item menu siap ditampilkan di sidebar (sembunyikan placeholder /segera). */
export function isNavItemReady(item: MenuItem): boolean {
  if (item.ready === false) return false;
  if (item.href.startsWith("/segera")) return false;
  return true;
}

function mapMenuItem(item: MenuItem, section?: string): ShellNavItem {
  return {
    id: item.id,
    label: item.label,
    href: item.href,
    external: item.external,
    icon: item.icon,
    section
  };
}

/** Navigasi sidebar dari RBAC — satu sumber kebenaran dengan dashboard lama. */
export function buildShellNav(session: Pick<SessionPayload, "role">): ShellNavItem[] {
  const cfg = getRoleConfig(session.role);
  const ready = cfg.menu.filter(isNavItemReady);

  if (session.role === "owner") {
    const items: ShellNavItem[] = [
      mapMenuItem({
        id: "ringkasan",
        label: "Ringkasan",
        desc: "Dashboard operasional",
        icon: "layout-dashboard",
        href: "/dashboard",
        phase: 4,
        ready: true,
        group: "operasional"
      })
    ];

    const buckets = new Map<DashboardMenuGroup, MenuItem[]>();
    for (const item of ready) {
      if (item.id === "owner-report") continue;
      const group = item.group ?? "operasional";
      const list = buckets.get(group) ?? [];
      list.push(item);
      buckets.set(group, list);
    }

    for (const group of DASHBOARD_GROUP_ORDER) {
      const groupItems = buckets.get(group);
      if (!groupItems?.length) continue;
      const section = DASHBOARD_GROUP_LABELS[group];
      for (const item of groupItems) {
        items.push(mapMenuItem(item, section));
      }
    }
    return injectUiNavExtras(items, session);
  }

  return injectUiNavExtras(
    [
      mapMenuItem({
        id: "ringkasan",
        label: session.role === "leader" ? "Ringkasan Outlet" : "Ringkasan",
        desc: "Dashboard",
        icon: "layout-dashboard",
        href: "/dashboard",
        phase: 4,
        ready: true
      }),
      ...ready.map((item) => mapMenuItem(item))
    ],
    session
  );
}

function injectUiNavExtras(
  items: ShellNavItem[],
  session: Pick<SessionPayload, "role">
): ShellNavItem[] {
  const opsRoles: Role[] = ["owner", "admin", "leader"];
  const extras: ShellNavItem[] = [];

  if (UI_FLAGS.ordersPageV1 && opsRoles.includes(session.role)) {
    extras.push({
      id: "orders",
      label: "Pesanan",
      href: "/orders",
      icon: "clipboard-list",
      section: "Operasional"
    });
  }

  if (UI_FLAGS.checkerReadV1 && opsRoles.includes(session.role)) {
    extras.push({
      id: "checker",
      label: "Checker",
      href: "/checker",
      icon: "check-circle",
      section: "Operasional"
    });
  }

  if (!extras.length) return items;

  const ringkasan = items.find((i) => i.id === "ringkasan");
  const rest = items.filter((i) => i.id !== "ringkasan");
  return ringkasan ? [ringkasan, ...extras, ...rest] : [...extras, ...items];
}

/** Shortcut operasional di top bar — hanya modul yang sudah ada. */
export function buildShellShortcuts(
  session: Pick<SessionPayload, "role" | "outletId">
): ShellShortcut[] {
  const outletQ = session.outletId ? `?outlet=${session.outletId}` : "";
  const posHref = posAppUrl(`/pos${outletQ}`);
  const kdsBase = configuredKdsUrl() || "/kds";
  const kdsHref = `${kdsBase}${outletQ}`;
  const kdsBarHref = `${kdsBase}${outletQ}${outletQ ? "&" : "?"}station=bar`;
  const floorHref = `/pos/floor${outletQ}`;

  const opsRoles: Role[] = ["owner", "admin", "leader"];
  const cashierRoles: Role[] = ["owner", "admin", "leader"];

  const shortcuts: ShellShortcut[] = [
    { id: "pos", label: "POS", href: posHref, external: posHref.startsWith("http"), roles: cashierRoles },
    { id: "dapur", label: "Dapur", href: `${kdsHref}${kdsHref.includes("?") ? "&" : "?"}station=dapur`, external: kdsBase.startsWith("http"), roles: opsRoles },
    { id: "bar", label: "Bar", href: kdsBarHref, external: kdsBase.startsWith("http"), roles: opsRoles }
  ];

  if (UI_FLAGS.ordersPageV1) {
    shortcuts.splice(1, 0, {
      id: "pesanan",
      label: "Pesanan",
      href: `/orders${outletQ}`,
      external: false,
      roles: opsRoles
    });
  }

  if (UI_FLAGS.checkerReadV1) {
    shortcuts.push({
      id: "checker",
      label: "Checker",
      href: `/checker${outletQ}`,
      external: false,
      roles: opsRoles
    });
  }

  if (session.outletId) {
    shortcuts.push({
      id: "meja",
      label: "Meja",
      href: floorHref,
      external: false,
      roles: opsRoles
    });
  }

  return shortcuts.filter((s) => s.roles.includes(session.role));
}

export function canShowOutletSwitcher(
  session: Pick<SessionPayload, "role" | "isSuperAdmin">
): boolean {
  return isGlobalRole(session.role, session.isSuperAdmin);
}
