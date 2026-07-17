import Link from "next/link";
import type { ComponentType } from "react";
import {
  Globe,
  LayoutGrid,
  Settings,
  Wallet,
  DoorClosed
} from "lucide-react";
import { PosExitLink } from "./PosExitLink";
import { formatRp } from "@/lib/finance";
import type { PosShift } from "@/lib/pos-kds-roadmap";

function ToolbarLink({
  href,
  label,
  icon: Icon,
  badge,
  accent
}: {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: number;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={accent ? "pos-toolbar-btn pos-toolbar-btn--accent" : "pos-toolbar-btn"}
      title={label}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-navy-800 px-1.5 py-0.5 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

/** Toolbar POS — hanya aksi kasir (tanpa portal reports/KDS/inventori). */
export function PosToolbar({
  outletId,
  outletName,
  shift,
  orderCount,
  shiftTotal,
  hasFloor,
  onlinePending,
  canConfigure
}: {
  outletId: string;
  outletName: string;
  shift: PosShift;
  orderCount: number;
  shiftTotal: number;
  hasFloor: boolean;
  onlinePending: number;
  canConfigure: boolean;
}) {
  return (
    <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <PosExitLink className="text-[10px] font-bold uppercase tracking-wide text-slate-400" />
        <h1 className="truncate text-lg font-black text-navy-900">{outletName}</h1>
        <p className="text-xs text-slate-600">
          Shift {shift.shiftLabel} · {orderCount} pesanan ·{" "}
          <span className="font-bold text-navy-800">{formatRp(shiftTotal)}</span>
        </p>
      </div>
      <nav aria-label="Aksi POS" className="flex max-w-full flex-wrap gap-1.5">
        {hasFloor && (
          <ToolbarLink href={`/pos/floor?outlet=${outletId}`} label="Meja" icon={LayoutGrid} />
        )}
        <ToolbarLink
          href={`/pos/drawer?outlet=${outletId}&shift=${shift.id}`}
          label="Laci"
          icon={Wallet}
        />
        <ToolbarLink
          href={`/pos/online?outlet=${outletId}`}
          label="Online"
          icon={Globe}
          badge={onlinePending}
          accent={onlinePending > 0}
        />
        {canConfigure && (
          <ToolbarLink href={`/pos/settings?outlet=${outletId}`} label="Atur" icon={Settings} />
        )}
        <ToolbarLink
          href={`/pos/close?outlet=${outletId}&shift=${shift.id}`}
          label="Tutup Shift"
          icon={DoorClosed}
        />
      </nav>
    </header>
  );
}
