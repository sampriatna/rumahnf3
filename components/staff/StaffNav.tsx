"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FilePlus, Inbox, BookOpen, Wallet } from "lucide-react";

const ITEMS = [
  { href: "/dashboard", label: "Beranda", icon: Home, match: (p: string) => p === "/dashboard" },
  {
    href: "/staff/form",
    label: "Form",
    icon: FilePlus,
    match: (p: string) => p.startsWith("/staff/form")
  },
  {
    href: "/staff/status",
    label: "Status",
    icon: Inbox,
    match: (p: string) => p === "/staff/status"
  },
  { href: "/sop", label: "SOP", icon: BookOpen, match: (p: string) => p.startsWith("/sop") },
  {
    href: "/staff/slip-gaji",
    label: "Gaji",
    icon: Wallet,
    match: (p: string) => p.startsWith("/staff/slip-gaji")
  }
] as const;

export function StaffNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200/80 bg-white/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(7,27,49,0.06)] backdrop-blur-md"
      aria-label="Navigasi staf"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 pt-1">
        {ITEMS.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[11px] font-bold transition ${
                  active ? "text-navy-800" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <span
                  className={`flex h-8 w-10 items-center justify-center rounded-xl transition ${
                    active ? "bg-navy-800 text-gold-400 shadow-sm" : ""
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
