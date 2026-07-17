import { OpStatusBadge } from "@/components/ui/OpStatusBadge";
import type { StatusTone } from "@/lib/design-tokens";

export function OrderItemRow({
  name,
  qty,
  statusLabel,
  tone = "muted"
}: {
  name: string;
  qty: number;
  statusLabel: string;
  tone?: StatusTone;
}) {
  return (
    <li className="flex items-center justify-between gap-2 text-sm">
      <span className="min-w-0 truncate font-semibold text-navy-900">
        <span className="text-rose-600">{qty}×</span> {name}
      </span>
      <OpStatusBadge tone={tone} className="shrink-0">
        {statusLabel}
      </OpStatusBadge>
    </li>
  );
}
