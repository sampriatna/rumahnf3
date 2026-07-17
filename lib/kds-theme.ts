import type { KdsOrderType, KdsFlowStatus } from "@/types/kds";

/** Warna = sinyal kemasan dapur. Hijau = piring, Biru/Orange/Ungu = takeaway box. */
export const KDS_ORDER_THEME: Record<
  KdsOrderType,
  {
    label: string;
    sublabel: string;
    /** Instruksi besar untuk tim dapur — dari warna card langsung tahu kemasan. */
    packaging: string;
    packagingDetail: string;
    border: string;
    bg: string;
    badge: string;
    packagingBanner: string;
    headerSolid: string;
    accent: string;
    priority: boolean;
  }
> = {
  dine_in: {
    label: "DINE-IN",
    sublabel: "Meja",
    packaging: "PAKAI PIRING",
    packagingDetail: "Saji ke meja — bukan box takeaway",
    border: "border-emerald-400",
    bg: "bg-emerald-950/40",
    badge: "bg-emerald-500 text-white",
    packagingBanner: "bg-emerald-600 text-white ring-2 ring-emerald-300/50",
    headerSolid: "bg-emerald-500",
    accent: "text-emerald-300",
    priority: false
  },
  takeaway: {
    label: "TAKE AWAY",
    sublabel: "Ambil sendiri",
    packaging: "PAKAI TAKEAWAY",
    packagingDetail: "Box + tas — customer bawa pulang",
    border: "border-blue-400",
    bg: "bg-blue-950/40",
    badge: "bg-blue-500 text-white",
    packagingBanner: "bg-blue-600 text-white ring-2 ring-blue-300/50",
    headerSolid: "bg-blue-500",
    accent: "text-blue-300",
    priority: false
  },
  ojol: {
    label: "OJOL / ONLINE FOOD",
    sublabel: "Driver menunggu",
    packaging: "PAKAI TAKEAWAY",
    packagingDetail: "Box + seal — serahkan ke driver (prioritas)",
    border: "border-orange-400",
    bg: "bg-gradient-to-br from-orange-950/60 to-rose-950/40",
    badge: "bg-orange-500 text-white ring-2 ring-rose-400/60",
    packagingBanner: "bg-orange-500 text-white ring-2 ring-rose-400",
    headerSolid: "bg-orange-500",
    accent: "text-orange-200",
    priority: true
  },
  delivery_wa: {
    label: "DELIVERY / WA",
    sublabel: "Antar ke alamat",
    packaging: "PAKAI TAKEAWAY",
    packagingDetail: "Box + tas — siap untuk delivery",
    border: "border-violet-400",
    bg: "bg-violet-950/40",
    badge: "bg-violet-500 text-white",
    packagingBanner: "bg-violet-600 text-white ring-2 ring-violet-300/50",
    headerSolid: "bg-violet-500",
    accent: "text-violet-300",
    priority: false
  }
};

/** Ringkasan legenda warna → kemasan (tampil di header KDS). */
export const KDS_PACKAGING_LEGEND = [
  { orderType: "dine_in" as const, color: "bg-emerald-500", short: "Hijau = Piring" },
  { orderType: "takeaway" as const, color: "bg-blue-500", short: "Biru = Takeaway" },
  { orderType: "ojol" as const, color: "bg-orange-500", short: "Orange = Takeaway (ojol)" }
];

export const KDS_STATION_LABEL: Record<string, string> = {
  dapur: "Dapur",
  bar: "Bar",
  packing: "Packing"
};

export const KDS_FLOW_LABEL: Record<KdsFlowStatus, string> = {
  baru: "Baru",
  diproces: "Diproses",
  siap: "Siap",
  problem: "Problem",
  selesai: "Selesai"
};

/** Timer tier dari detik sejak createdAt. */
export type KdsTimerTier = "normal" | "warning" | "orange" | "late";

export function kdsTimerTier(seconds: number): KdsTimerTier {
  const mins = seconds / 60;
  if (mins >= 15) return "late";
  if (mins >= 10) return "orange";
  if (mins >= 5) return "warning";
  return "normal";
}

export const KDS_TIMER_STYLE: Record<
  KdsTimerTier,
  { ring: string; text: string; bg: string; label: string }
> = {
  normal: { ring: "ring-slate-600", text: "text-slate-200", bg: "bg-slate-800", label: "" },
  warning: {
    ring: "ring-yellow-400",
    text: "text-yellow-300",
    bg: "bg-yellow-900/50",
    label: "Perhatian"
  },
  orange: {
    ring: "ring-orange-400",
    text: "text-orange-300",
    bg: "bg-orange-900/50",
    label: "Lama"
  },
  late: {
    ring: "ring-rose-500",
    text: "text-rose-300",
    bg: "bg-rose-900/60",
    label: "TELAT"
  }
};

export function formatKdsTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
