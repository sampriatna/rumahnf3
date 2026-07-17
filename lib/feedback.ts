// Status request/feedback dalam bahasa lapangan. Dipakai lintas form, approval, task.

export type RequestStatus =
  | "menunggu_dicek"
  | "diproses"
  | "disetujui"
  | "ditolak"
  | "perlu_revisi"
  | "dikirim"
  | "diterima"
  | "selesai";

type StatusMeta = { label: string; className: string };

export const STATUS_META: Record<RequestStatus, StatusMeta> = {
  menunggu_dicek: { label: "Menunggu Dicek", className: "bg-amber-100 text-amber-800" },
  diproses: { label: "Sedang Diproses", className: "bg-blue-100 text-blue-800" },
  disetujui: { label: "Disetujui", className: "bg-emerald-100 text-emerald-800" },
  ditolak: { label: "Ditolak", className: "bg-rose-100 text-rose-700" },
  perlu_revisi: { label: "Perlu Diperbaiki", className: "bg-orange-100 text-orange-800" },
  dikirim: { label: "Sudah Dikirim", className: "bg-cyan-100 text-cyan-800" },
  diterima: { label: "Sudah Diterima", className: "bg-teal-100 text-teal-800" },
  selesai: { label: "Sudah Selesai", className: "bg-green-100 text-green-800" }
};

export function statusLabel(status: RequestStatus) {
  return STATUS_META[status]?.label ?? status;
}
