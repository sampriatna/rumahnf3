// Transfer request gudang pusat → outlet (draft → approved → sent → received).

export type TransferStatus =
  | "pending_approval" // legacy — diperlakukan sama seperti approved
  | "approved"
  | "sent"
  | "received"
  | "rejected"
  | "cancelled";

export type TransferLine = {
  itemId: string;
  itemName: string;
  qty: number;
  unit: string;
};

export type StockTransferRequest = {
  id: string;
  requestNumber: string;
  fromLocationId: string;
  fromLocationLabel: string;
  toOutletId: string;
  toOutletName?: string;
  status: TransferStatus;
  items: TransferLine[];
  requestedById: string;
  requestedByName: string;
  note?: string;
  approvedById?: string;
  approvedByName?: string;
  approvedAt?: string;
  sentById?: string;
  sentByName?: string;
  sentAt?: string;
  receivedById?: string;
  receivedByName?: string;
  receivedAt?: string;
  rejectionNote?: string;
  createdAt: string;
  updatedAt: string;
};

export const TRANSFER_STATUS_LABEL: Record<TransferStatus, string> = {
  pending_approval: "Menunggu Gudang",
  approved: "Menunggu Gudang",
  sent: "Dalam Pengiriman",
  received: "Diterima",
  rejected: "Ditolak",
  cancelled: "Dibatalkan"
};

/** Siap dikirim gudang (tanpa approval owner). */
export function isTransferAwaitingSend(status: TransferStatus) {
  return status === "approved" || status === "pending_approval";
}
