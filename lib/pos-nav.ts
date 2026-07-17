import type { Role } from "./types";

export type PosNavId =
  | "sync"
  | "sell"
  | "history"
  | "shift"
  | "member"
  | "recap"
  | "attendance"
  | "settings";

export type PosNavItem = {
  id: PosNavId;
  label: string;
  /** Minimum roles that can see this item. */
  roles: readonly Role[];
  /** leader, admin, owner only */
  adminPlus?: boolean;
  phase?: "A" | "B" | "C" | "D";
};

/** Urutan drawer sesuai AUDIT_NF3_POS Section 1. */
export const POS_DRAWER_NAV: PosNavItem[] = [
  { id: "sync", label: "Sinkronkan Penjualan", roles: ["staff", "leader", "admin", "owner"] },
  { id: "sell", label: "Mulai Penjualan", roles: ["staff", "leader", "admin", "owner"] },
  { id: "history", label: "Riwayat Penjualan", roles: ["staff", "leader", "admin", "owner"] },
  { id: "shift", label: "Ganti Shift / Hari", roles: ["staff", "leader", "admin", "owner"] },
  { id: "member", label: "Member Deposit", roles: ["leader", "admin", "owner"], adminPlus: true },
  { id: "recap", label: "Detail Rekapitulasi", roles: ["leader", "admin", "owner"], adminPlus: true },
  { id: "attendance", label: "Absen", roles: ["staff", "leader", "admin", "owner"] },
  { id: "settings", label: "Pengaturan", roles: ["leader", "admin", "owner"], adminPlus: true }
];

export type PosQuickLink = {
  id: string;
  label: string;
  href: string;
  badge?: number;
};

export function canSeePosNavItem(item: PosNavItem, role: Role): boolean {
  return item.roles.includes(role);
}

export function filterPosNavForRole(role: Role): PosNavItem[] {
  return POS_DRAWER_NAV.filter((item) => canSeePosNavItem(item, role));
}

export function posNavHref(
  id: PosNavId,
  outletId: string,
  shiftId?: string
): string {
  const q = `outlet=${outletId}`;
  switch (id) {
    case "sync":
      return `/pos/sync?${q}`;
    case "sell":
      return `/pos?${q}`;
    case "history":
      return `/pos/history?${q}`;
    case "shift":
      return shiftId ? `/pos/shift?${q}&shift=${shiftId}` : `/pos/shift?${q}`;
    case "member":
      return `/pos/member-deposit?${q}`;
    case "recap":
      return `/pos/recap?${q}`;
    case "attendance":
      return `/pos/attendance?${q}`;
    case "settings":
      return `/pos/settings?${q}`;
    default:
      return `/pos?${q}`;
  }
}

/** Map pathname (+ optional segment) ke nav id aktif. */
export function activePosNavId(pathname: string): PosNavId {
  if (pathname === "/pos" || pathname.startsWith("/pos/checkout")) return "sell";
  if (pathname.startsWith("/pos/sync")) return "sync";
  if (pathname.startsWith("/pos/history")) return "history";
  if (
    pathname.startsWith("/pos/shift") ||
    pathname.startsWith("/pos/close") ||
    pathname.startsWith("/pos/drawer") ||
    pathname.startsWith("/pos/expenses")
  ) {
    return "shift";
  }
  if (pathname.startsWith("/pos/member-deposit")) return "member";
  if (pathname.startsWith("/pos/recap") || pathname.startsWith("/pos/reports")) return "recap";
  if (pathname.startsWith("/pos/attendance")) return "attendance";
  if (pathname.startsWith("/pos/settings")) return "settings";
  if (pathname.startsWith("/pos/floor") || pathname.startsWith("/pos/online")) return "sell";
  return "sell";
}

export function posQuickLinks(
  outletId: string,
  shiftId: string | undefined,
  opts: { hasFloor: boolean; onlinePending: number }
): PosQuickLink[] {
  const links: PosQuickLink[] = [];
  if (opts.hasFloor) {
    links.push({ id: "floor", label: "Denah Meja", href: `/pos/floor?outlet=${outletId}` });
  }
  links.push({
    id: "online",
    label: "Order Online",
    href: `/pos/online?outlet=${outletId}`,
    badge: opts.onlinePending
  });
  if (shiftId) {
    links.push({
      id: "drawer",
      label: "Laci Kas",
      href: `/pos/drawer?outlet=${outletId}&shift=${shiftId}`
    });
    links.push({
      id: "expenses",
      label: "Pengeluaran",
      href: `/pos/expenses?outlet=${outletId}&shift=${shiftId}`
    });
  }
  return links;
}
