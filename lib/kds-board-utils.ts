import type { KdsOrderTicket, KdsStationId, KdsFlowStatus } from "@/types/kds";

export function ticketHasStation(ticket: KdsOrderTicket, stationId: KdsStationId): boolean {
  return ticket.items.some((i) => i.station === stationId);
}

export function stationStatus(ticket: KdsOrderTicket, stationId: KdsStationId): KdsFlowStatus | null {
  const items = ticket.items.filter((i) => i.station === stationId);
  if (!items.length) return null;
  if (items.every((i) => i.status === "problem")) return "problem";
  if (items.every((i) => i.status === "siap")) return "siap";
  if (items.some((i) => i.status === "diproces")) return "diproces";
  if (items.some((i) => i.status === "problem")) return "problem";
  return "baru";
}

export function stationStatuses(ticket: KdsOrderTicket): { station: KdsStationId; status: KdsFlowStatus }[] {
  const ids = [...new Set(ticket.items.map((i) => i.station))];
  return ids
    .map((station) => ({ station, status: stationStatus(ticket, station)! }))
    .filter((x) => x.status != null);
}

export function overallOrderLabel(ticket: KdsOrderTicket): "Lengkap" | "Belum Lengkap" {
  const stats = stationStatuses(ticket);
  if (!stats.length) return "Belum Lengkap";
  return stats.every((s) => s.status === "siap") ? "Lengkap" : "Belum Lengkap";
}

export function timerSeconds(ticket: KdsOrderTicket): number {
  return Math.floor((Date.now() - new Date(ticket.createdAt).getTime()) / 1000);
}

export function itemsForStation(ticket: KdsOrderTicket, stationId: KdsStationId) {
  return ticket.items.filter((i) => i.station === stationId);
}
