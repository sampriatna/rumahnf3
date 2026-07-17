import Link from "next/link";
import { formatRp } from "@/lib/finance";
import type { FloorTableView, TableStatus } from "@/lib/pos-floor-ui";
import { TABLE_STATUS_STYLE } from "@/lib/pos-floor-ui";
import { OpStatusBadge } from "@/components/ui/OpStatusBadge";

function statusTone(status: TableStatus): "muted" | "ready" | "progress" | "active" {
  if (status === "empty") return "muted";
  if (status === "open") return "ready";
  if (status === "held") return "progress";
  return "active";
}

export function TableCard({
  table,
  href
}: {
  table: FloorTableView;
  outletId?: string;
  href: string;
}) {
  const style = TABLE_STATUS_STYLE[table.status];

  return (
    <Link
      href={href}
      className={`group flex flex-col rounded-2xl p-4 ring-2 transition hover:scale-[1.02] active:scale-[0.98] ${style.bg} ${style.ring}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-black text-navy-900">Meja {table.label}</p>
        <OpStatusBadge tone={statusTone(table.status)}>{style.label}</OpStatusBadge>
      </div>
      <p className="mt-1 text-xs text-slate-600">{table.seats} kursi · {table.zone}</p>
      {table.total != null && (
        <p className="mt-3 text-base font-black text-navy-800">{formatRp(table.total)}</p>
      )}
      {table.orderNumber && (
        <p className="mt-1 text-[11px] font-semibold text-slate-500">{table.orderNumber}</p>
      )}
      {(table.pendingKitchen ?? 0) > 0 && (
        <p className="mt-2 text-xs font-bold text-amber-800">
          {table.pendingKitchen} item belum ke dapur
        </p>
      )}
      {table.status === "empty" && (
        <p className="mt-3 text-xs font-bold text-navy-700 opacity-0 transition group-hover:opacity-100">
          Tap untuk buka order baru →
        </p>
      )}
      {table.orderId && (
        <span className="mt-2 text-[10px] font-bold uppercase text-slate-400">
          Tap untuk bill / bayar
        </span>
      )}
    </Link>
  );
}

export function FloorLegend() {
  const keys = Object.keys(TABLE_STATUS_STYLE) as TableStatus[];
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {keys.map((key) => {
        const s = TABLE_STATUS_STYLE[key];
        return (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`h-3.5 w-3.5 rounded-md ring-2 ${s.bg} ${s.ring}`} />
            <span className="font-semibold text-slate-600">{s.label}</span>
          </span>
        );
      })}
    </div>
  );
}

export function FloorStats({
  floor
}: {
  floor: FloorTableView[];
}) {
  const empty = floor.filter((t) => t.status === "empty").length;
  const open = floor.filter((t) => t.status === "open").length;
  const held = floor.filter((t) => t.status === "held").length;
  const partial = floor.filter((t) => t.status === "partial").length;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <div className="rounded-xl bg-slate-50 px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase text-slate-400">Kosong</p>
        <p className="text-lg font-black text-slate-700">{empty}</p>
      </div>
      <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase text-emerald-600">Terisi</p>
        <p className="text-lg font-black text-emerald-800">{open}</p>
      </div>
      <div className="rounded-xl bg-amber-50 px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase text-amber-600">Hold</p>
        <p className="text-lg font-black text-amber-800">{held}</p>
      </div>
      <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
        <p className="text-[10px] font-bold uppercase text-blue-600">Partial</p>
        <p className="text-lg font-black text-blue-800">{partial}</p>
      </div>
    </div>
  );
}
