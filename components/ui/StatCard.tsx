import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./Card";

type Tone = "default" | "success" | "warning" | "neutral" | "info";

const TONE_CLASS: Record<Tone, string> = {
  default: "text-navy-900",
  success: "text-emerald-800",
  warning: "text-amber-800",
  neutral: "text-slate-700",
  info: "text-sky-800"
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
  className
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: Tone;
  className?: string;
}) {
  return (
    <Card className={cn("p-4", className)}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={cn("mt-1 text-xl font-black", TONE_CLASS[tone])}>{value}</p>
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </Card>
  );
}
