"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Warehouse,
  BarChart3,
  Truck,
  History,
  ShoppingCart,
  Database,
  ChevronLeft,
  MapPin
} from "lucide-react";
import { UI_FLAGS } from "@/lib/ui-flags";

type NavItem = {
  href: string;
  label: string;
  desc: string;
  icon: typeof BarChart3;
  match: (path: string) => boolean;
  adminOnly?: boolean;
};

const NAV: NavItem[] = [
  {
    href: "/inventory",
    label: "Saldo",
    desc: "Qty per lokasi",
    icon: BarChart3,
    match: (p) => p === "/inventory"
  },
  {
    href: "/inventory/transfers",
    label: "Transfer",
    desc: "Gudang → outlet",
    icon: Truck,
    match: (p) => p.startsWith("/inventory/transfers")
  },
  {
    href: "/inventory/movements",
    label: "Riwayat",
    desc: "Log pergerakan",
    icon: History,
    match: (p) => p.startsWith("/inventory/movements")
  },
  {
    href: "/purchasing",
    label: "Purchasing",
    desc: "PO & request",
    icon: ShoppingCart,
    match: (p) => p.startsWith("/purchasing")
  },
  {
    href: "/inventory/data",
    label: "Kelola Data",
    desc: "Master & mutasi",
    icon: Database,
    match: (p) => p.startsWith("/inventory/data"),
    adminOnly: true
  }
];

export function InventorySidebar({
  canManageData,
  outletLabel
}: {
  canManageData: boolean;
  outletLabel?: string;
}) {
  const pathname = usePathname() ?? "";
  const items = NAV.filter((n) => !n.adminOnly || canManageData);
  const shellOn = UI_FLAGS.appShell;
  const invUi = UI_FLAGS.inventoryUiV1;

  return (
    <>
      <aside className="hidden w-56 shrink-0 lg:block">
        <div className="sticky top-6 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-800 text-gold-400 shadow-sm">
              <Warehouse className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-black text-navy-900">Inventory</p>
              <p className="text-[10px] font-medium text-slate-500">Stok multi-outlet</p>
            </div>
          </div>

          {outletLabel && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs text-amber-950">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
              <div>
                <p className="font-bold">Outlet kamu</p>
                <p className="mt-0.5 leading-snug text-amber-800">{outletLabel}</p>
              </div>
            </div>
          )}

          <nav className="grid gap-1" aria-label="Navigasi inventory">
            {items.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    active
                      ? "bg-navy-900 text-white shadow-md shadow-navy-900/20"
                      : "text-slate-600 hover:bg-white hover:text-navy-900 hover:shadow-sm"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? "text-gold-400" : "text-slate-400 group-hover:text-navy-700"}`}
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-tight">{item.label}</p>
                    <p className={`text-[10px] ${active ? "text-slate-300" : "text-slate-400"}`}>
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </nav>

          {invUi && (
            <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
              Stok = hasil mutasi (masuk, transfer, pemakaian, waste). Tidak ada edit qty langsung.
            </p>
          )}

          {!shellOn && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-xs font-bold text-navy-700 hover:underline"
            >
              <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
              Dashboard
            </Link>
          )}
        </div>
      </aside>

      <nav
        className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden"
        aria-label="Navigasi inventory mobile"
      >
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                active
                  ? "bg-navy-900 text-white shadow-sm"
                  : "border border-slate-200 bg-white text-slate-600"
              }`}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {outletLabel && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 lg:hidden">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
          <span>
            <strong>Scope:</strong> {outletLabel}
          </span>
        </div>
      )}
    </>
  );
}
