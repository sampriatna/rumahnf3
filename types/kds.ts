/**
 * KDS Board — model produksi dapur/bar (fase awal: dummy in-memory).
 *
 * Workflow:
 * 1. Order masuk POS → ticket + items per station (Dapur / Bar / Packing).
 * 2. Warna card = kemasan: hijau Dine-In (piring), biru/orange/ungu (takeaway box).
 * 2. Station view: kolom BARU → DIPROSES → SIAP.
 * 3. Tombol: Proses (baru→diproces), Siap (diproces→siap), Problem (→problem + alasan).
 * 4. Satu order bisa beda status per station; overall "Belum Lengkap" sampai semua siap.
 * 5. Tanpa harga — hanya produksi.
 */

export type KdsStationId = string;

export type KdsOrderType = "dine_in" | "takeaway" | "ojol" | "delivery_wa";

/** Status alur produksi — 3 step + problem. */
export type KdsFlowStatus = "baru" | "diproces" | "siap" | "problem" | "selesai";

export type KdsProblemReason =
  | "bahan_habis"
  | "menu_sold_out"
  | "alat_bermasalah"
  | "catatan_tidak_jelas"
  | "lainnya";

export const KDS_PROBLEM_OPTIONS: { value: KdsProblemReason; label: string }[] = [
  { value: "bahan_habis", label: "Bahan habis" },
  { value: "menu_sold_out", label: "Menu sold out" },
  { value: "alat_bermasalah", label: "Alat bermasalah" },
  { value: "catatan_tidak_jelas", label: "Catatan order tidak jelas" },
  { value: "lainnya", label: "Lainnya" }
];

export type KdsTicketItem = {
  itemId: string;
  ticketId: string;
  menuName: string;
  qty: number;
  modifiers: string[];
  notes?: string;
  status: KdsFlowStatus;
  station: KdsStationId;
};

/** Ticket level — satu order di board KDS. */
export type KdsOrderTicket = {
  ticketId: string;
  orderId: string;
  outletId: string;
  orderType: KdsOrderType;
  orderNumber: string;
  tableNumber?: string;
  customerName?: string;
  /** GoFood / GrabFood / ShopeeFood untuk ojol. */
  channel?: string;
  /** Station utama untuk routing tampilan (semua item tetap di ticket). */
  station: KdsStationId;
  status: KdsFlowStatus;
  priority: number;
  createdAt: string;
  startedAt?: string;
  readyAt?: string;
  notes?: string;
  problemReason?: KdsProblemReason;
  problemNote?: string;
  items: KdsTicketItem[];
};

export type KdsBoardColumn = "baru" | "diproces" | "siap";

export type KdsBoardPayload = {
  baru: KdsOrderTicket[];
  diproces: KdsOrderTicket[];
  siap: KdsOrderTicket[];
  servedToday: number;
};

export type KdsSoundSettings = {
  enabled: boolean;
  volume: number;
  /** Detik sebelum alert diulang untuk order BARU yang belum diproses. */
  repeatIntervalSec: number;
};

export const DEFAULT_KDS_SOUND: KdsSoundSettings = {
  enabled: true,
  volume: 0.85,
  repeatIntervalSec: 60
};
