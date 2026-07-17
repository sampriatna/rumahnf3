import { STATUS_META, type RequestStatus } from "@/lib/feedback";

export function StatusBadge({ status }: { status: RequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}
