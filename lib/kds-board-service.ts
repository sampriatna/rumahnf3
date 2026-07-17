import type {
  KdsOrderTicket,
  KdsStationId,
  KdsFlowStatus,
  KdsBoardColumn,
  KdsBoardPayload,
  KdsProblemReason
} from "@/types/kds";
import {
  ticketHasStation,
  stationStatus,
  stationStatuses,
  overallOrderLabel,
  timerSeconds
} from "./kds-board-utils";
import { store } from "./store";
import {
  listStations,
  bootstrapStationsFromSeed,
  type KdsStation
} from "./station-service";
import { ensurePosSeeded } from "./pos-service";
import { syncKdsBoardFromPos, syncPosItemsFromBoard } from "./kds-pos-bridge";
import { recordKdsDiscrepancies } from "./kds-discrepancy";

const ACTIVE: KdsFlowStatus[] = ["baru", "diproces", "siap", "problem"];

function ensureBoardSeeded() {
  ensurePosSeeded();
  const s = store();
  if (!s.kdsStations.length) bootstrapStationsFromSeed();
  if (!s.kdsSeeded) {
    s.kdsTickets = [];
    s.kdsTicketSeq = {};
    s.kdsSeeded = true;
  }
  if (!s.kdsBoardSeeded) {
    s.kdsBoardTickets = [];
    s.kdsBoardServedToday = {};
    s.kdsBoardSeeded = true;
  }
}

function ensureBoardForOutlet(outletId: string) {
  ensureBoardSeeded();
  syncKdsBoardFromPos(outletId);
}

export function getStations(outletId: string): KdsStation[] {
  ensureBoardSeeded();
  return listStations(outletId, true);
}

export function getBoardTicket(ticketId: string) {
  ensureBoardSeeded();
  return store().kdsBoardTickets.find((t) => t.ticketId === ticketId);
}

function columnForStation(ticket: KdsOrderTicket, stationId: KdsStationId): KdsBoardColumn | null {
  const st = stationStatus(ticket, stationId);
  if (!st || st === "selesai") return null;
  if (st === "problem") return "baru";
  return st as KdsBoardColumn;
}

export function listBoard(outletId: string, stationId: KdsStationId): KdsBoardPayload {
  ensureBoardForOutlet(outletId);
  const tickets = store()
    .kdsBoardTickets.filter(
      (t) => t.outletId === outletId && ACTIVE.includes(t.status) && ticketHasStation(t, stationId)
    )
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  const baru: KdsOrderTicket[] = [];
  const diproces: KdsOrderTicket[] = [];
  const siap: KdsOrderTicket[] = [];

  for (const t of tickets) {
    const col = columnForStation(t, stationId);
    if (col === "baru") baru.push(t);
    else if (col === "diproces") diproces.push(t);
    else if (col === "siap") siap.push(t);
  }

  const servedKey = `${outletId}:${stationId}`;
  const servedToday = store().kdsBoardServedToday[servedKey] ?? 0;

  return { baru, diproces, siap, servedToday };
}

function syncTicketStatus(ticket: KdsOrderTicket) {
  const stats = stationStatuses(ticket);
  if (stats.every((s) => s.status === "siap")) {
    ticket.status = "selesai";
    ticket.readyAt = new Date().toISOString();
  } else if (stats.some((s) => s.status === "problem")) {
    ticket.status = "problem";
  } else if (stats.some((s) => s.status === "diproces")) {
    ticket.status = "diproces";
  } else {
    ticket.status = "baru";
  }
}

function updateStationItems(ticket: KdsOrderTicket, stationId: KdsStationId, status: KdsFlowStatus) {
  for (const it of ticket.items) {
    if (it.station === stationId) it.status = status;
  }
}

export function prosesTicket(ticketId: string, stationId: KdsStationId, _actorName: string) {
  ensureBoardSeeded();
  const ticket = getBoardTicket(ticketId);
  if (!ticket || !ticketHasStation(ticket, stationId)) return null;

  const now = new Date().toISOString();
  if (!ticket.startedAt) ticket.startedAt = now;
  updateStationItems(ticket, stationId, "diproces");
  ticket.problemReason = undefined;
  ticket.problemNote = undefined;
  syncTicketStatus(ticket);
  syncPosItemsFromBoard(ticket.orderId, stationId, "diproces");
  recordKdsDiscrepancies(ticket.orderId);
  return ticket;
}

export function siapTicket(ticketId: string, stationId: KdsStationId, _actorName: string) {
  ensureBoardSeeded();
  const ticket = getBoardTicket(ticketId);
  if (!ticket || !ticketHasStation(ticket, stationId)) return null;

  updateStationItems(ticket, stationId, "siap");
  syncTicketStatus(ticket);
  syncPosItemsFromBoard(ticket.orderId, stationId, "siap");

  if (ticket.status === "selesai") {
    const key = `${ticket.outletId}:${stationId}`;
    store().kdsBoardServedToday[key] = (store().kdsBoardServedToday[key] ?? 0) + 1;
    const idx = store().kdsBoardTickets.findIndex((t) => t.ticketId === ticketId);
    if (idx >= 0) store().kdsBoardTickets.splice(idx, 1);
  }

  recordKdsDiscrepancies(ticket.orderId);
  return ticket;
}

export function problemTicket(
  ticketId: string,
  stationId: KdsStationId,
  reason: KdsProblemReason,
  note: string,
  _actorName: string
) {
  ensureBoardSeeded();
  const ticket = getBoardTicket(ticketId);
  if (!ticket || !ticketHasStation(ticket, stationId)) return null;

  updateStationItems(ticket, stationId, "problem");
  ticket.problemReason = reason;
  ticket.problemNote = note || undefined;
  ticket.status = "problem";
  return ticket;
}

export function boardTicketIds(outletId: string, stationId: KdsStationId): string[] {
  const board = listBoard(outletId, stationId);
  return [...board.baru, ...board.diproces, ...board.siap].map((t) => t.ticketId);
}

export function injectDemoTicket(outletId: string) {
  ensureBoardSeeded();
  const id = `demo-${Date.now()}`;
  const ticket: KdsOrderTicket = {
    ticketId: id,
    orderId: `ord-${id}`,
    outletId,
    orderType: "ojol",
    orderNumber: `KBU-${Math.floor(Math.random() * 9000) + 1000}`,
    customerName: "ShopeeFood",
    channel: "ShopeeFood",
    station: "dapur",
    status: "baru",
    priority: 2,
    createdAt: new Date().toISOString(),
    items: [
      {
        itemId: `${id}-1`,
        ticketId: id,
        menuName: "Nasi Goreng KBU",
        qty: 1,
        modifiers: [],
        status: "baru",
        station: "dapur"
      },
      {
        itemId: `${id}-2`,
        ticketId: id,
        menuName: "Latte",
        qty: 1,
        modifiers: ["Less sugar"],
        status: "baru",
        station: "bar"
      }
    ]
  };
  store().kdsBoardTickets.unshift(ticket);
  return ticket;
}

export { ensureBoardSeeded, timerSeconds, stationStatuses, overallOrderLabel };
