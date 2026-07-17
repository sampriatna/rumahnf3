"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { ICONS } from "@/components/icon-map";
import type { ShellNavItem } from "@/lib/nav-items";

function isActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({
  items,
  collapsed,
  onNavigate
}: {
  items: ShellNavItem[];
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  let lastSection: string | undefined;

  return (
    <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3" aria-label="Navigasi utama">
      {items.map((item) => {
        const showSection = item.section && item.section !== lastSection;
        if (item.section) lastSection = item.section;
        const Icon = ICONS[item.icon];
        const active = isActive(pathname, item.href);

        return (
          <div key={item.id}>
            {showSection && !collapsed && (
              <p className="mb-1 mt-4 px-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 first:mt-0">
                {item.section}
              </p>
            )}
            {item.external ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                title={collapsed ? item.label : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition",
                  "text-slate-600 hover:bg-slate-100 hover:text-navy-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </a>
            ) : (
              <Link
                href={item.href}
                title={collapsed ? item.label : undefined}
                aria-current={active ? "page" : undefined}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-semibold transition",
                  active
                    ? "bg-navy-800 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 hover:text-navy-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
