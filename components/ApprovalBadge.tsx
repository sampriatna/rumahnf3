import { APPROVAL_STATUS_META, type ApprovalStatus } from "@/lib/approval";

export function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const meta = APPROVAL_STATUS_META[status];
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
}
