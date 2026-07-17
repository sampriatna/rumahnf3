import type { Approval } from "./approval";
import type { Submission } from "./store";

export type InboxGroupId =
  | "semua"
  | "masuk"
  | "menunggu_approval"
  | "diproses"
  | "perlu_revisi"
  | "selesai"
  | "macet";

export const INBOX_GROUPS: { id: InboxGroupId; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "masuk", label: "Request Masuk" },
  { id: "menunggu_approval", label: "Menunggu Approval" },
  { id: "diproses", label: "Diproses" },
  { id: "perlu_revisi", label: "Perlu Revisi" },
  { id: "selesai", label: "Selesai" },
  { id: "macet", label: "Macet" }
];

const SELESAI_STATUSES = new Set<Submission["status"]>([
  "selesai",
  "disetujui",
  "ditolak",
  "diterima",
  "dikirim"
]);

const MACET_MS = 2 * 24 * 60 * 60 * 1000;

function isPendingApproval(sub: Submission, approvals: Approval[]): boolean {
  if (!sub.needsApproval) return false;
  const approval = approvals.find((a) => a.id === sub.approvalId || a.requestId === sub.id);
  return approval?.status === "pending";
}

function isMacet(sub: Submission, now = Date.now()): boolean {
  const stuck =
    sub.status === "menunggu_dicek" ||
    sub.status === "diproses" ||
    sub.status === "perlu_revisi";
  if (!stuck) return false;
  return now - new Date(sub.createdAt).getTime() >= MACET_MS;
}

export function filterInboxByGroup(
  items: Submission[],
  group: InboxGroupId,
  approvals: Approval[]
): Submission[] {
  if (group === "semua") return items;

  return items.filter((sub) => {
    switch (group) {
      case "masuk":
        return sub.status === "menunggu_dicek";
      case "menunggu_approval":
        return isPendingApproval(sub, approvals);
      case "diproses":
        return sub.status === "diproses";
      case "perlu_revisi":
        return sub.status === "perlu_revisi";
      case "selesai":
        return SELESAI_STATUSES.has(sub.status);
      case "macet":
        return isMacet(sub);
      default:
        return true;
    }
  });
}

export function countInboxByGroup(
  items: Submission[],
  approvals: Approval[]
): Record<InboxGroupId, number> {
  return INBOX_GROUPS.reduce(
    (acc, { id }) => {
      acc[id] = filterInboxByGroup(items, id, approvals).length;
      return acc;
    },
    {} as Record<InboxGroupId, number>
  );
}
