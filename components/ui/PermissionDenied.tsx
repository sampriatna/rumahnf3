import Link from "next/link";
import { ShieldOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export function PermissionDenied({
  title = "Akses ditolak",
  description = "Anda tidak memiliki izin untuk membuka halaman ini. Hubungi admin jika Anda membutuhkan akses.",
  backHref = "/dashboard",
  backLabel = "Kembali ke Ringkasan",
  className
}: {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  className?: string;
}) {
  return (
    <Card className={cn("mx-auto max-w-lg px-6 py-10 text-center", className)} role="alert">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
        <ShieldOff className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="text-lg font-black text-navy-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      <Link href={backHref} className="btn-secondary mt-5 inline-flex px-4 py-2 text-sm">
        {backLabel}
      </Link>
    </Card>
  );
}
