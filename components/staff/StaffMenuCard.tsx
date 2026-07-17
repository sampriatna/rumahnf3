import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { ICONS } from "@/components/icon-map";

export function StaffMenuCard({ item }: { item: MenuItem }) {
  const Icon = ICONS[item.icon];

  const inner = (
    <div className="staff-card-interactive flex min-h-[88px] items-center gap-4 p-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-navy-700 text-gold-400 shadow-sm">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-base font-bold text-navy-900">{item.label}</h3>
          {item.sensitive && (
            <span className="shrink-0 rounded-md bg-rose-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-700">
              Rahasia
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-slate-600">{item.desc}</p>
        {item.external && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-navy-600">
            <ExternalLink className="h-3 w-3" aria-hidden />
            {item.externalLabel ?? "Buka aplikasi"}
          </span>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden />
    </div>
  );

  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return (
    <Link href={item.href} className="block">
      {inner}
    </Link>
  );
}
