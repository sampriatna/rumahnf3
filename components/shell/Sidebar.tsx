"use client";

import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { APP_NAME } from "@/lib/constants";
import { shellLayout } from "@/lib/design-tokens";
import type { ShellNavItem } from "@/lib/nav-items";
import { SidebarNav } from "./SidebarNav";

function SidebarChrome({
  items,
  collapsed,
  onCollapsedChange,
  onNavigate,
  showMobileClose
}: {
  items: ShellNavItem[];
  collapsed: boolean;
  onCollapsedChange?: (value: boolean) => void;
  onNavigate?: () => void;
  showMobileClose?: boolean;
}) {
  return (
    <>
      <div className="flex h-14 items-center gap-2 border-b border-slate-200 px-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-xs font-black text-gold-400">
          NF3
        </span>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-navy-900">{APP_NAME}</p>
            <p className="truncate text-[10px] text-slate-500">Command Center</p>
          </div>
        )}
        {showMobileClose ? (
          <button
            type="button"
            onClick={onNavigate}
            className="ml-auto inline-flex rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-800"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onCollapsedChange?.(!collapsed)}
            className="ml-auto inline-flex rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-navy-800"
            aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" aria-hidden />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            )}
          </button>
        )}
      </div>
      <SidebarNav items={items} collapsed={collapsed} onNavigate={onNavigate} />
    </>
  );
}

export function Sidebar({
  items,
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose
}: {
  items: ShellNavItem[];
  collapsed: boolean;
  onCollapsedChange: (value: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}) {
  return (
    <>
      <aside
        className={`hidden shrink-0 flex-col border-r border-slate-200 bg-white lg:flex ${
          collapsed ? shellLayout.sidebarCollapsed : shellLayout.sidebarWidth
        }`}
      >
        <SidebarChrome
          items={items}
          collapsed={collapsed}
          onCollapsedChange={onCollapsedChange}
        />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Tutup menu"
            onClick={onMobileClose}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl">
            <SidebarChrome
              items={items}
              collapsed={false}
              onNavigate={onMobileClose}
              showMobileClose
            />
          </aside>
        </div>
      )}
    </>
  );
}
