import type { KdsFlowStatus } from "@/types/kds";
import { store } from "./store";
import { ensurePosSeeded } from "./pos-service";
import { syncKdsBoardFromPos } from "./kds-pos-bridge";
import { listStations } from "./station-service";
import {
  overallOrderLabel,
  stationStatuses,
  timerSeconds
} from "./kds-board-utils";
import { KDS_FLOW_LABEL, KDS_STATION_LABEL } from "./kds-theme";
import { channelDisplayName } from "./channel-service";
import type { PosOrder } from "./pos-kds-roadmap";
import { getOpenShift, listShiftOrders } from "./pos-service";

const ACTIVE: KdsFlowStatus[] = ["baru", "diproces", "siap", "problem"];

export type CheckerStationProgress = {
  stationId: string;
  stationName: string;
  status: KdsFlowStatus;
  statusLabel: string;
  itemCount: number;
  readyCount: number;
};

export type CheckerItemRow = {
  name: string;
  qty: number;
  stationId: string;
  stationName: string;
  status: KdsFlowStatus;
  statusLabel: string;
  modifiers: string[];
  notes?: string;
};

export type CheckerOrderView = {
  orderId: string;
  orderNumber: string;
  tableLabel?: string;
  channelLabel: string;
  createdAt: string;
  overallReady: boolean;
  readinessLabel: string;
  waitingStation?: string;
  elapsedSec: number;
  stations: CheckerStationProgress[];
  items: CheckerItemRow[];
};

function ensureCheckerBoard(outletId: string) {
  ensurePosSeeded();
  syncKdsBoardFromPos(outletId);
}

function readinessLabel(
  overallReady: boolean,
  stations: CheckerStationProgress[]
): { label: string; waitingStation?: string } {
  if (overallReady) return { label: "Siap Disajikan" };
  const waiting = stations.filter((s) => s.status !== "siap");
  if (waiting.length === 1) {
    return { label: `Menunggu ${waiting[0].stationName}`, waitingStation: waiting[0].stationName };
  }
  return { label: "Belum Lengkap", waitingStation: waiting.map((s) => s.stationName).join(" + ") };
}

function mapTicketToCheckerView(
  outletId: string,
  ticket: import("@/types/kds").KdsOrderTicket
): CheckerOrderView {
  const stationRows = stationStatuses(ticket).map((s) => {
    const items = ticket.items.filter((i) => i.station === s.station);
    const readyCount = items.filter((i) => i.status === "siap").length;
    return {
      stationId: s.station,
      stationName: KDS_STATION_LABEL[s.station] ?? s.station,
      status: s.status,
      statusLabel: KDS_FLOW_LABEL[s.status],
      itemCount: items.length,
      readyCount
    };
  });

  const overallReady = overallOrderLabel(ticket) === "Lengkap";
  const { label, waitingStation } = readinessLabel(overallReady, stationRows);

  return {
    orderId: ticket.orderId,
    orderNumber: ticket.orderNumber,
    tableLabel: ticket.tableNumber ? `Meja ${ticket.tableNumber}` : undefined,
    channelLabel: ticket.channel ?? "Pesanan",
    createdAt: ticket.createdAt,
    overallReady,
    readinessLabel: label,
    waitingStation,
    elapsedSec: timerSeconds(ticket),
    stations: stationRows,
    items: ticket.items.map((it) => ({
      name: it.menuName,
      qty: it.qty,
      stationId: it.station,
      stationName: KDS_STATION_LABEL[it.station] ?? it.station,
      status: it.status,
      statusLabel: KDS_FLOW_LABEL[it.status],
      modifiers: it.modifiers,
      notes: it.notes
    }))
  };
}

/** Pesanan aktif dari board KDS — read-only, tanpa write. */
export function listCheckerOrders(outletId: string): CheckerOrderView[] {
  ensureCheckerBoard(outletId);
  const tickets = store()
    .kdsBoardTickets.filter((t) => t.outletId === outletId && ACTIVE.includes(t.status))
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  return tickets.map((t) => mapTicketToCheckerView(outletId, t));
}

/** Fallback: pesanan POS shift yang belum selesai tapi belum di board. */
export function listCheckerPosFallback(outletId: string): CheckerOrderView[] {
  const shift = getOpenShift(outletId);
  if (!shift) return [];
  const onBoard = new Set(listCheckerOrders(outletId).map((o) => o.orderId));

  return listShiftOrders(shift.id)
    .filter(
      (o) =>
        o.outletId === outletId &&
        !onBoard.has(o.id) &&
        ["open", "held", "paid"].includes(o.status)
    )
    .map((o) => mapPosOrderFallback(outletId, o));
}

function mapPosOrderFallback(outletId: string, order: PosOrder): CheckerOrderView {
  const pending = order.items.filter((i) => i.status === "pending").length;
  const fired = order.items.filter((i) => ["fired", "cooking"].includes(i.status)).length;
  const ready = order.items.filter((i) => ["ready", "served"].includes(i.status)).length;

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    tableLabel: order.tableLabel,
    channelLabel: channelDisplayName(outletId, order.channel),
    createdAt: order.createdAt,
    overallReady: ready === order.items.length && order.items.length > 0,
    readinessLabel: pending > 0 ? "Belum Dikirim Dapur" : fired > 0 ? "Sedang Dibuat" : "Belum Lengkap",
    elapsedSec: Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000),
    stations: listStations(outletId, true).map((st) => ({
      stationId: st.id,
      stationName: st.name,
      status: "baru" as KdsFlowStatus,
      statusLabel: "Menunggu",
      itemCount: order.items.length,
      readyCount: ready
    })),
    items: order.items.map((it) => ({
      name: it.nameSnapshot,
      qty: it.qty,
      stationId: "dapur",
      stationName: "Dapur",
      status: it.status === "ready" || it.status === "served" ? "siap" : it.status === "pending" ? "baru" : "diproces",
      statusLabel:
        it.status === "ready" || it.status === "served"
          ? "Siap"
          : it.status === "pending"
            ? "Menunggu"
            : "Sedang Dibuat",
      modifiers: it.modifiersSnapshot.map((m) => m.name),
      notes: it.note
    }))
  };
}

export function listCheckerBoard(outletId: string): CheckerOrderView[] {
  const primary = listCheckerOrders(outletId);
  const fallback = listCheckerPosFallback(outletId);
  return [...primary, ...fallback];
}
