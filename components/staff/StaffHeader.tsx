import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function StaffHeader({
  title,
  subtitle,
  backHref
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
}) {
  return (
    <header className="mb-6">
      {backHref && (
        <Link
          href={backHref}
          className="mb-3 inline-flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-bold text-navy-700 shadow-sm ring-1 ring-slate-200/80 transition hover:bg-white"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          Kembali
        </Link>
      )}
      <h1 className="text-2xl font-black tracking-tight text-navy-900">{title}</h1>
      {subtitle && <p className="mt-1.5 max-w-[36ch] text-sm leading-relaxed text-slate-600">{subtitle}</p>}
    </header>
  );
}
