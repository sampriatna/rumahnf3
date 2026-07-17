"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import {
  RefreshCw,
  ShoppingCart,
  History,
  CalendarClock,
  Users,
  BarChart3,
  Clock,
  Settings,
  LayoutGrid,
  Globe,
  Wallet,
  Menu,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  activePosNavId,
  filterPosNavForRole,
  posNavHref,
  posQuickLinks,
  type PosNavId
} from "@/lib/pos-nav";
import type { Role } from "@/lib/types";
import { PosDrawerExitLink } from "./PosDrawerExitLink";

const NAV_ICONS: Record<PosNavId, LucideIcon> = {
  sync: RefreshCw,
  sell: ShoppingCart,
  history: History,
  shift: CalendarClock,
  member: Users,
  recap: BarChart3,
  attendance: Clock,
  settings: Settings
};

type DrawerState = { open: boolean; setOpen: (v: boolean) => void };

const DrawerCtx = createContext<DrawerState | null>(null);

function useDrawer() {
  const ctx = useContext(DrawerCtx);
  if (!ctx) throw new Error("PosDrawerMobileTrigger must be inside PosDrawerProvider");
  return ctx;
}

export function PosDrawerMobileTrigger() {
  const { setOpen } = useDrawer();
  return (
    <button
      type="button"
      className="pos-drawer-toggle shrink-0 lg:hidden"
      onClick={() => setOpen(true)}
      aria-label="Buka menu"
    >
      <Menu className="h-5 w-5" aria-hidden />
    </button>
  );
}

function DrawerNavBody({
  outletId,
  shiftId,
  userRole,
  hasFloor,
  onlinePending,
  posOnlyStaff,
  onNavigate
}: {
  outletId: string;
  shiftId?: string;
  userRole: Role;
  hasFloor: boolean;
  onlinePending: number;
  posOnlyStaff: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const active = activePosNavId(pathname);
  const items = filterPosNavForRole(userRole);
  const quick = posQuickLinks(outletId, shiftId, { hasFloor, onlinePending });

  return (
    <>
      <div className="border-b border-slate-200 px-4 py-3">
        <PosDrawerExitLink
          posOnlyStaff={posOnlyStaff}
          className="text-[10px] font-bold uppercase tracking-wide text-slate-400"
        />
        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">Menu Kasir</p>
      </div>
      <nav aria-label="Navigasi POS" className="flex-1 overflow-y-auto px-2 py-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const Icon = NAV_ICONS[item.id];
            const isActive = active === item.id;
            const href = posNavHref(item.id, outletId, shiftId);
            return (
              <li key={item.id}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "bg-navy-800 text-white shadow-sm"
                      : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  {item.phase && (
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {item.phase}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
        {quick.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Aksi Cepat
            </p>
            <ul className="space-y-0.5">
              {quick.map((link) => (
                <li key={link.id}>
                  <Link
                    href={link.href}
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                  >
                    {link.id === "floor" && <LayoutGrid className="h-3.5 w-3.5" aria-hidden />}
                    {link.id === "online" && <Globe className="h-3.5 w-3.5" aria-hidden />}
                    {link.id === "drawer" && <Wallet className="h-3.5 w-3.5" aria-hidden />}
                    <span className="flex-1">{link.label}</span>
                    {link.badge != null && link.badge > 0 && (
                      <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>
    </>
  );
}

function PosDrawerAside({
  outletId,
  shiftId,
  userRole,
  hasFloor,
  onlinePending,
  posOnlyStaff
}: {
  outletId: string;
  shiftId?: string;
  userRole: Role;
  hasFloor: boolean;
  onlinePending: number;
  posOnlyStaff: boolean;
}) {
  const { open, setOpen } = useDrawer();
  const close = () => setOpen(false);

  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-navy-900/40 lg:hidden"
          aria-label="Tutup menu"
          onClick={close}
        />
      )}
      <aside
        className={`pos-drawer-aside z-50 lg:hidden ${open ? "pos-drawer-aside--open" : ""}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className="absolute right-3 top-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          onClick={close}
          aria-label="Tutup"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
        <DrawerNavBody
          outletId={outletId}
          shiftId={shiftId}
          userRole={userRole}
          hasFloor={hasFloor}
          onlinePending={onlinePending}
          posOnlyStaff={posOnlyStaff}
          onNavigate={close}
        />
      </aside>
      <aside className="pos-drawer-aside pos-drawer-aside--desktop hidden shrink-0 lg:flex">
        <DrawerNavBody
          outletId={outletId}
          shiftId={shiftId}
          userRole={userRole}
          hasFloor={hasFloor}
          onlinePending={onlinePending}
          posOnlyStaff={posOnlyStaff}
        />
      </aside>
    </>
  );
}

export function PosDrawerProvider({
  outletId,
  shiftId,
  userRole,
  hasFloor,
  onlinePending,
  posOnlyStaff,
  children
}: {
  outletId: string;
  shiftId?: string;
  userRole: Role;
  hasFloor: boolean;
  onlinePending: number;
  posOnlyStaff: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <DrawerCtx.Provider value={{ open, setOpen }}>
      <div className="pos-drawer-shell flex min-h-screen bg-surface">
        <PosDrawerAside
          outletId={outletId}
          shiftId={shiftId}
          userRole={userRole}
          hasFloor={hasFloor}
          onlinePending={onlinePending}
          posOnlyStaff={posOnlyStaff}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </DrawerCtx.Provider>
  );
}
