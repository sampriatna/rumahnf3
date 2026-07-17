import type { KdsTicket, KdsTicketStatus, PosOrder } from "./pos-kds-roadmap";
import { store, nextId } from "./store";
import { resolveKdsStation } from "./pos-seed";
import { listStations, bootstrapStationsFromSeed, type KdsStation } from "./station-service";
import { ensurePosSeeded } from "./pos-service";
import { upsertBoardTicketFromOrder } from "./kds-pos-bridge";
import { PHASE0_FLAGS } from "./phase0-flags";
import { isDualWriteEnabledFor } from "./dual-write";

const ACTIVE: KdsTicketStatus[] = ["new", "acknowledged", "cooking", "ready"];

function canonicalBoardWriterEnabled() {
  return PHASE0_FLAGS.kdsCanonicalBoardWriter;
}

function ensureKdsSeeded() {
  ensurePosSeeded();
  const s = store();
  if (!s.kdsStations.length) bootstrapStationsFromSeed();
  if (!s.kdsSeeded) {
    s.kdsTickets = [];
    s.kdsTicketSeq = {};
    s.kdsSeeded = true;
  }
}

function ticketSeqKey(outletId: string, areaId: string) {
  return `${outletId}:${areaId}`;
}

function nextTicketNumber(outletId: string, areaId: string) {
  ensureKdsSeeded();
  const key = ticketSeqKey(outletId, areaId);
  const seq = (store().kdsTicketSeq[key] ?? 0) + 1;
  store().kdsTicketSeq[key] = seq;
  return seq;
}

/** Buat ticket KDS — default hanya item status pending (kirim dapur incremental). */
export function fireKdsTicketsForOrder(
  order: PosOrder,
  opts?: { onlyPending?: boolean }
) {
  ensureKdsSeeded();
  const s = store();
  const onlyPending = opts?.onlyPending !== false;
  const persistLegacyTickets = !canonicalBoardWriterEnabled() || isDualWriteEnabledFor("kds");
  const now = new Date().toISOString();
  const created: KdsTicket[] = [];

  for (const line of order.items) {
    if (onlyPending && line.status !== "pending") continue;
    if (
      persistLegacyTickets &&
      s.kdsTickets.some((t) => t.orderItemId === line.id && t.status !== "void")
    ) {
      continue;
    }
    if (!line.menuItemId) continue;
    const menuItem = s.menuItems.find((m) => m.id === line.menuItemId);
    if (!menuItem) continue;

    const areaId = resolveKdsStation(menuItem, order.channel);
    const ticket: KdsTicket = {
      id: nextId("KDS"),
      orderId: order.id,
      orderItemId: line.id,
      outletId: order.outletId,
      areaId,
      ticketNumber: nextTicketNumber(order.outletId, areaId),
      status: "new",
      priority: order.channel === "gofood" || order.channel === "grab" ? 1 : 0,
      firedAt: now,
      itemName: line.nameSnapshot,
      qty: line.qty,
      note: line.note,
      tableLabel: order.tableLabel,
      channel: order.channel,
      orderNumber: order.orderNumber
    };
    if (persistLegacyTickets) {
      s.kdsTickets.unshift(ticket);
    }
    line.status = "fired";
    created.push(ticket);
  }

  if (created.length > 0 && !order.kitchenSentAt) {
    order.kitchenSentAt = now;
  }

  if (canonicalBoardWriterEnabled() || order.kitchenSentAt) {
    upsertBoardTicketFromOrder(order);
  }

  return created;
}

export function countPendingKitchenItems(order: PosOrder) {
  ensureKdsSeeded();
  if (canonicalBoardWriterEnabled()) {
    return order.items.filter((it) => it.status === "pending").length;
  }
  const firedIds = new Set(
    store()
      .kdsTickets.filter((t) => t.orderId === order.id && t.status !== "void")
      .map((t) => t.orderItemId)
  );
  return order.items.filter((it) => it.status === "pending" && !firedIds.has(it.id)).length;
}

export function getStations(outletId: string): KdsStation[] {
  ensureKdsSeeded();
  return listStations(outletId, true);
}

export function getTicket(id: string) {
  ensureKdsSeeded();
  return store().kdsTickets.find((t) => t.id === id);
}

export function listActiveTickets(outletId: string, areaId: string) {
  ensureKdsSeeded();
  return store()
    .kdsTickets.filter(
      (t) =>
        t.outletId === outletId &&
        t.areaId === areaId &&
        ACTIVE.includes(t.status)
    )
    .sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return new Date(a.firedAt).getTime() - new Date(b.firedAt).getTime();
    });
}

export function listTicketsByStatus(outletId: string, areaId: string) {
  const tickets = listActiveTickets(outletId, areaId);
  return {
    incoming: tickets.filter((t) => t.status === "new" || t.status === "acknowledged"),
    cooking: tickets.filter((t) => t.status === "cooking"),
    ready: tickets.filter((t) => t.status === "ready")
  };
}

export function countServedToday(outletId: string, areaId: string) {
  ensureKdsSeeded();
  const today = new Date().toDateString();
  return store().kdsTickets.filter(
    (t) =>
      t.outletId === outletId &&
      t.areaId === areaId &&
      t.status === "served" &&
      t.servedAt &&
      new Date(t.servedAt).toDateString() === today
  ).length;
}

export function advanceTicket(ticketId: string, actorName: string) {
  ensureKdsSeeded();
  if (canonicalBoardWriterEnabled() && !isDualWriteEnabledFor("kds")) return null;
  const ticket = getTicket(ticketId);
  if (!ticket || ticket.status === "served" || ticket.status === "void") return null;

  const now = new Date().toISOString();

  switch (ticket.status) {
    case "new":
    case "acknowledged":
      ticket.status = "cooking";
      ticket.cookingAt = now;
      break;
    case "cooking":
      ticket.status = "ready";
      ticket.readyAt = now;
      syncOrderItemStatus(ticket.orderItemId, "ready");
      break;
    case "ready":
      ticket.status = "served";
      ticket.servedAt = now;
      syncOrderItemStatus(ticket.orderItemId, "served");
      break;
    default:
      return null;
  }

  return ticket;
}

export function bumpTicket(ticketId: string, reason?: string) {
  ensureKdsSeeded();
  if (canonicalBoardWriterEnabled() && !isDualWriteEnabledFor("kds")) return null;
  const ticket = getTicket(ticketId);
  if (!ticket || ticket.status === "served" || ticket.status === "void") return null;

  ticket.status = "bumped";
  ticket.bumpedAt = new Date().toISOString();
  ticket.bumpReason = reason;
  syncOrderItemStatus(ticket.orderItemId, "void");
  return ticket;
}

function voidKdsTicketForItem(orderItemId: string) {
  for (const ticket of store().kdsTickets) {
    if (ticket.orderItemId === orderItemId && ticket.status !== "void") {
      ticket.status = "void";
      ticket.bumpedAt = new Date().toISOString();
      ticket.bumpReason = "Item void di POS";
    }
  }
}

export function voidKdsTicketForOrderItem(orderItemId: string) {
  ensureKdsSeeded();
  if (!canonicalBoardWriterEnabled() || isDualWriteEnabledFor("kds")) {
    voidKdsTicketForItem(orderItemId);
  }

  const order = store().posOrders.find((o) => o.items.some((it) => it.id === orderItemId));
  if (order && canonicalBoardWriterEnabled()) {
    upsertBoardTicketFromOrder(order);
  }
}

export function syncKdsFromOrder(order: PosOrder) {
  ensureKdsSeeded();
  if (canonicalBoardWriterEnabled()) {
    upsertBoardTicketFromOrder(order);
  }
}

function syncOrderItemStatus(orderItemId: string, status: "ready" | "served" | "void") {
  for (const order of store().posOrders) {
    const line = order.items.find((it) => it.id === orderItemId);
    if (line) {
      line.status = status;
      return;
    }
  }
}

export function elapsedMinutes(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export function kdsActionLabel(status: KdsTicketStatus): string {
  switch (status) {
    case "new":
    case "acknowledged":
      return "Mulai Masak";
    case "cooking":
      return "Siap!";
    case "ready":
      return "Sudah Diambil";
    default:
      return "—";
  }
}

export { ensureKdsSeeded };
