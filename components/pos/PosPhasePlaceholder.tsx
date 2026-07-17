import type { ReactNode } from "react";
import { Construction } from "lucide-react";

export function PosPhasePlaceholder({
  title,
  phase,
  description,
  children
}: {
  title: string;
  phase: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="pos-panel mx-auto max-w-lg p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Construction className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
            Fase {phase} — segera
          </p>
          <h2 className="text-lg font-black text-navy-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
