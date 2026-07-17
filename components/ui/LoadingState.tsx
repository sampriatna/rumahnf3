import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

export function LoadingState({
  title = "Memuat data…",
  description,
  className
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <Card
      className={cn("flex flex-col items-center justify-center px-6 py-10 text-center", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 className="h-8 w-8 animate-spin text-navy-800" aria-hidden />
      <p className="mt-3 text-sm font-bold text-navy-900">{title}</p>
      {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
    </Card>
  );
}
