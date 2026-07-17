/** Label tipe pesanan POS (Bahasa Indonesia) — display only. */

import type { SalesChannelKind } from "./channel-service";

export const CHANNEL_KIND_LABEL: Record<SalesChannelKind, string> = {
  dine_in: "Makan di Tempat",
  takeaway: "Bawa Pulang",
  delivery_own: "Pesan Antar",
  platform: "Ojol / Platform",
  wholesale: "Grosir",
  production: "Produksi Internal",
  other: "Lainnya"
};

/** Channel utama kasir (bukan platform ojol — itu lewat /pos/online). */
export const POS_PRIMARY_CHANNEL_KINDS: SalesChannelKind[] = [
  "dine_in",
  "takeaway",
  "delivery_own"
];

export function channelLabelIndonesia(
  channelId: string,
  channelName: string,
  kind: SalesChannelKind
): string {
  if (kind === "dine_in" || channelId === "dine_in") return "Makan di Tempat";
  if (kind === "takeaway" || channelId === "takeaway") return "Bawa Pulang";
  if (kind === "delivery_own" || channelId === "delivery_own") return "Pesan Antar";
  return channelName;
}
