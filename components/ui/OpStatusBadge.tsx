import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { statusTone, type StatusTone } from "@/lib/design-tokens";

export function OpStatusBadge({
  tone = "muted",
  children,
  className
}: {
  tone?: StatusTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        statusTone[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
