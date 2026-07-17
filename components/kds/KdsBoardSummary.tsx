import type { KdsOrderTicket } from "@/types/kds";
import { kdsTimerTier, KDS_FLOW_LABEL } from "@/lib/kds-theme";
import { timerSeconds } from "@/lib/kds-board-utils";
import { kdsColumnLabel } from "@/lib/ui-labels";

type Column = {
  key: "baru" | "diproces" | "siap";
  tickets: KdsOrderTicket[];
};

export function KdsBoardSummary({ columns }: { columns: Column[] }) {
  const all = columns.flatMap((c) => c.tickets);
  const baru = columns.find((c) => c.key === "baru")?.tickets.length ?? 0;
  const diproces = columns.find((c) => c.key === "diproces")?.tickets.length ?? 0;
  const siap = columns.find((c) => c.key === "siap")?.tickets.length ?? 0;
  const late = all.filter((t) => {
    const tier = kdsTimerTier(timerSeconds(t));
    return tier === "late" || tier === "orange";
  }).length;

  const chips = [
    { key: "baru", label: kdsColumnLabel.baru, count: baru, className: "bg-sky-600" },
    { key: "diproces", label: kdsColumnLabel.diproces, count: diproces, className: "bg-amber-500" },
    { key: "siap", label: kdsColumnLabel.siap, count: siap, className: "bg-emerald-600" }
  ] as const;

  return (
    <div className="mx-2 mb-1 mt-2 flex shrink-0 flex-wrap items-center gap-2 rounded-lg bg-navy-900/90 px-3 py-2 text-white shadow md:mx-3">
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Ringkasan</span>
      {chips.map((c) => (
        <span
          key={c.key}
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${c.className}`}
        >
          {c.label}
          <span className="rounded-full bg-black/25 px-1.5 text-[10px]">{c.count}</span>
        </span>
      ))}
      {late > 0 && (
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-rose-600 px-2.5 py-1 text-xs font-black animate-pulse">
          Terlambat {late}
        </span>
      )}
      <span className="hidden text-[10px] text-slate-400 sm:inline">
        {KDS_FLOW_LABEL.baru} / {KDS_FLOW_LABEL.diproces} / {KDS_FLOW_LABEL.siap}
      </span>
    </div>
  );
}
