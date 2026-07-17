import type { Submission } from "./store";
import type { Role } from "./types";

// Status approval — bahasa lapangan untuk UI.
export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "need_revision"
  | "partially_approved";

export type ApproverLevel = "leader" | "owner";

export type Approval = {
  id: string;
  requestType: string;
  requestLabel: string;
  requestId: string;
  requestedById: string;
  requestedByName: string;
  outletId?: string;
  outletName?: string;
  amount?: number;
  reason?: string;
  status: ApprovalStatus;
  /** Siapa yang WAJIB memutuskan (routing). */
  approverLevel: ApproverLevel;
  approvedById?: string;
  approvedByName?: string;
  approvalNote?: string;
  createdAt: string;
  updatedAt: string;
};

export const APPROVAL_STATUS_META: Record<
  ApprovalStatus,
  { label: string; className: string }
> = {
  pending: { label: "Menunggu Keputusan", className: "bg-amber-100 text-amber-800" },
  approved: { label: "Disetujui", className: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Ditolak", className: "bg-rose-100 text-rose-700" },
  need_revision: { label: "Perlu Diperbaiki", className: "bg-orange-100 text-orange-800" },
  partially_approved: { label: "Disetujui Sebagian", className: "bg-cyan-100 text-cyan-800" }
};

/** Nominal besar (form / PO belanja) → owner. Selisih setoran besar → owner. */
export const OWNER_AMOUNT_THRESHOLD = 2_000_000;
export const OWNER_PURCHASE_THRESHOLD = OWNER_AMOUNT_THRESHOLD;
const OWNER_SETORAN_SELISIH_THRESHOLD = 100_000;

export function needsOwnerPurchaseApproval(totalEstimated: number) {
  return totalEstimated >= OWNER_PURCHASE_THRESHOLD;
}

export function extractAmount(sub: Submission): number | undefined {
  if (sub.formType === "setoran_kasir") {
    return Number(sub.payload.total_setoran) || undefined;
  }
  if (sub.formType === "selisih_kas") {
    return Math.abs(Number(sub.payload.selisih) || 0) || undefined;
  }
  const nominal = Number(sub.payload.nominal);
  return nominal > 0 ? nominal : undefined;
}

export function extractReason(sub: Submission): string | undefined {
  return (
    sub.payload.alasan ||
    sub.payload.cerita ||
    sub.payload.penjelasan ||
    sub.payload.keterangan ||
    sub.payload.deskripsi ||
    sub.payload.stok_penting ||
    sub.payload.nama_bahan ||
    undefined
  );
}

/** Tentukan leader vs owner siapa yang harus approve. */
export function resolveApproverLevel(sub: Submission): ApproverLevel {
  const amount = extractAmount(sub);

  if (amount != null && amount >= OWNER_AMOUNT_THRESHOLD) return "owner";

  if (sub.formType === "setoran_kasir") {
    const selisih = Math.abs(Number(sub.payload.selisih_vs_sistem) || 0);
    if (selisih >= OWNER_SETORAN_SELISIH_THRESHOLD) return "owner";
  }

  if (sub.formType === "selisih_kas") {
    const selisih = Math.abs(Number(sub.payload.selisih) || 0);
    if (selisih >= OWNER_SETORAN_SELISIH_THRESHOLD) return "owner";
  }

  // Izin, request bahan, opname → leader dulu (kecuali nominal besar di atas).
  return "leader";
}

/** Apakah role session boleh memutus approval ini? */
export function canDecideApproval(
  role: Role,
  approval: Approval,
  sessionOutletId?: string
): boolean {
  if (approval.status !== "pending") return false;

  if (approval.requestType === "purchase_order" && approval.approverLevel === "owner") {
    return role === "owner";
  }

  if (role === "owner" || role === "admin") return true;

  if (role === "leader") {
    if (approval.approverLevel === "owner") return false;
    if (sessionOutletId && approval.outletId && approval.outletId !== sessionOutletId) {
      return false;
    }
    return true;
  }

  return false;
}

/** Filter daftar approval yang user boleh lihat. */
export function filterApprovalsForRole(
  items: Approval[],
  role: Role,
  sessionOutletId?: string
): Approval[] {
  if (role === "owner" || role === "admin") return items;

  if (role === "leader") {
    return items.filter(
      (a) =>
        a.approverLevel === "leader" &&
        (!sessionOutletId || !a.outletId || a.outletId === sessionOutletId)
    );
  }

  return [];
}

/** Map status approval → status request (feedback ke staf). */
export function approvalToRequestStatus(status: ApprovalStatus) {
  switch (status) {
    case "approved":
    case "partially_approved":
      return "disetujui" as const;
    case "rejected":
      return "ditolak" as const;
    case "need_revision":
      return "perlu_revisi" as const;
    default:
      return "menunggu_dicek" as const;
  }
}

export function requestTypeLabel(type: string) {
  const labels: Record<string, string> = {
    request_bahan: "Request Bahan",
    izin: "Izin / Absensi",
    setoran_kasir: "Setoran Kasir",
    stock_opname: "Stock Opname",
    pengeluaran_kas_kecil: "Pengeluaran Kas Kecil",
    purchase_order: "Purchase Order (Belanja Besar)",
    kasbon: "Kasbon",
    selisih_kas: "Selisih Kas",
    upload_nota: "Upload Nota Belanja"
  };
  return labels[type] ?? type;
}
