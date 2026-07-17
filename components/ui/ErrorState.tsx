import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export function ErrorState({
  title = "Gagal memuat",
  description = "Terjadi kesalahan saat mengambil data. Coba lagi atau kembali ke ringkasan.",
  retryHref,
  retryLabel = "Coba lagi",
  className
}: {
  title?: string;
  description?: string;
  retryHref?: string;
  retryLabel?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}
      role="alert"
    >
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
        <AlertTriangle className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-sm font-bold text-navy-900">{title}</p>
      <p className="mt-1 max-w-md text-xs text-slate-500">{description}</p>
      {retryHref && (
        <Link href={retryHref} className="btn-secondary mt-4 inline-flex px-4 py-2 text-sm">
          {retryLabel}
        </Link>
      )}
    </Card>
  );
}
