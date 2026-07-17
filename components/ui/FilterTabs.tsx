"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";

export function FilterTabs({
  tabs,
  param = "filter"
}: {
  tabs: Array<{ id: string; label: string; count?: number }>;
  param?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = searchParams.get(param) ?? tabs[0]?.id ?? "all";

  return (
    <nav
      aria-label="Filter"
      className="flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-100/80 p-1"
    >
      {tabs.map((tab) => {
        const params = new URLSearchParams(searchParams.toString());
        if (tab.id === "all") params.delete(param);
        else params.set(param, tab.id);
        const href = params.toString() ? `${pathname}?${params}` : pathname;
        const isActive = active === tab.id || (tab.id === "all" && !searchParams.get(param));

        return (
          <Link
            key={tab.id}
            href={href}
            className={cn(
              "rounded-lg px-3 py-2 text-xs font-bold transition",
              isActive
                ? "bg-white text-navy-900 shadow-sm"
                : "text-slate-600 hover:text-navy-800"
            )}
          >
            {tab.label}
            {tab.count != null && (
              <span className="ml-1.5 rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px]">
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
