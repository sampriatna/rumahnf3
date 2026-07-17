import { Info } from "lucide-react";

export function MetricLabel({ label, hint }: { label: string; hint?: string }) {
  if (!hint) {
    return <span>{label}</span>;
  }

  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <span
        title={hint}
        className="inline-flex cursor-help text-slate-400"
        aria-label={`${label}: ${hint}`}
      >
        <Info className="h-3 w-3" aria-hidden />
      </span>
    </span>
  );
}
