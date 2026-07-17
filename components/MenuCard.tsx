import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import type { MenuItem } from "@/lib/types";
import { ICONS } from "./icon-map";

// Kartu menu/ruang. Mode `big` dipakai untuk staf (tombol besar, gaptek-friendly).
export function MenuCard({ item, big = false }: { item: MenuItem; big?: boolean }) {
  const Icon = ICONS[item.icon];
  const isPlaceholder = !item.external && !item.ready && item.phase > 1;

  const inner = (
    <div
      className={`panel group flex h-full items-start gap-4 p-5 transition hover:border-gold-400 hover:shadow-soft ${
        big ? "min-h-[112px]" : ""
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700 transition group-hover:bg-navy-100 ${
          big ? "h-14 w-14" : "h-11 w-11"
        }`}
      >
        <Icon className={big ? "h-7 w-7" : "h-5 w-5"} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className={`font-bold text-navy-900 ${big ? "text-lg" : "text-base"}`}>{item.label}</h3>
          {item.external && <ExternalLink className="h-3.5 w-3.5 text-slate-400" aria-hidden />}
          {item.sensitive && (
            <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-bold text-rose-700">
              RAHASIA
            </span>
          )}
        </div>
        <p className={`mt-1 text-slate-600 ${big ? "text-sm" : "text-xs"}`}>{item.desc}</p>
        {isPlaceholder && (
          <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
            Segera · Fase {item.phase}
          </span>
        )}
        {item.external && item.externalLabel && (
          <span className="mt-2 inline-block rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
            {item.externalLabel}
          </span>
        )}
      </div>

      <span className="ml-auto shrink-0 self-center text-slate-300 transition group-hover:text-gold-500">
        {item.external ? (
          <ExternalLink className="h-5 w-5" aria-hidden />
        ) : (
          <ChevronRight className="h-5 w-5" aria-hidden />
        )}
      </span>
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
