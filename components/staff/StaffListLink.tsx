import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export function StaffListLink({
  href,
  title,
  description,
  icon: Icon
}: {
  href: string;
  title: string;
  description?: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className="staff-card-interactive flex items-center gap-3.5 p-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-bold text-navy-900">{title}</h3>
        {description && <p className="mt-0.5 text-sm leading-snug text-slate-600">{description}</p>}
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
    </Link>
  );
}
