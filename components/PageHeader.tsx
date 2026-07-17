import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

export function PageHeader({
  title,
  subtitle,
  backHref = "/dashboard",
  breadcrumbs
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  breadcrumbs?: BreadcrumbItem[];
}) {
  return (
    <header className="mb-6">
      <nav aria-label="Navigasi halaman" className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 font-bold text-navy-700 hover:text-navy-900"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Kembali
        </Link>
        {breadcrumbs && breadcrumbs.length > 0 && (
          <>
            <span className="text-slate-300" aria-hidden>
              |
            </span>
            <ol className="inline-flex flex-wrap items-center gap-x-1.5">
              {breadcrumbs.map((item, i) => (
                <li key={`${item.label}-${i}`} className="inline-flex items-center gap-x-1.5">
                  {i > 0 && (
                    <span className="text-slate-400" aria-hidden>
                      ›
                    </span>
                  )}
                  {item.href ? (
                    <Link href={item.href} className="font-semibold text-slate-600 hover:text-navy-800">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-slate-500">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </>
        )}
      </nav>
      <h1 className="text-2xl font-black text-navy-900">{title}</h1>
      {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
    </header>
  );
}
