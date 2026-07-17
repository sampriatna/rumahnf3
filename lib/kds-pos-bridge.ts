import type { PosOrder, PosOrderChannel, PosOrderItem } from "./pos-kds-roadmap";

import type { KdsOrderTicket, KdsOrderType, KdsFlowStatus, KdsStationId, KdsTicketItem } from "@/types/kds";

import { store } from "./store";

import { resolveKdsStation } from "./pos-seed";

import { ensurePosSeeded } from "./pos-service";

import { getSalesChannel, isPlatformChannel, channelDisplayName } from "./channel-service";



const KITCHEN_ORDER_STATUS = new Set(["open", "paid", "held"]);



const LEGACY_PLATFORM = new Set(["gofood", "grab", "shopee"]);



export function channelToKdsOrderType(channel: PosOrderChannel, outletId?: string): KdsOrderType {

  if (outletId) {

    const ch = getSalesChannel(outletId, channel);

    if (ch) {

      switch (ch.kind) {

        case "dine_in":

          return "dine_in";

        case "takeaway":

          return "takeaway";

        case "platform":

          return "ojol";

        case "delivery_own":

          return "delivery_wa";

        default:

          return "takeaway";

      }

    }

  }

  if (channel === "dine_in") return "dine_in";

  if (channel === "takeaway") return "takeaway";

  if (LEGACY_PLATFORM.has(channel)) return "ojol";

  if (channel === "delivery_own") return "delivery_wa";

  return "takeaway";

}



export function kdsPriority(channel: PosOrderChannel, outletId?: string): number {

  if (outletId ? isPlatformChannel(outletId, channel) : LEGACY_PLATFORM.has(channel)) return 2;

  if (channel === "delivery_own") return 1;

  return 0;

}



function parseTableNumber(tableLabel?: string): string | undefined {

  if (!tableLabel?.trim()) return undefined;

  const m = tableLabel.match(/meja\s*#?\s*(\d+)/i);

  if (m) return m[1];

  const num = tableLabel.match(/(\d+)/);

  return num?.[1] ?? tableLabel;

}



export function posItemToKdsStatus(status: PosOrderItem["status"]): KdsFlowStatus | null {

  switch (status) {

    case "pending":

      return null;

    case "fired":

      return "baru";

    case "cooking":

      return "diproces";

    case "ready":

    case "served":

      return "siap";

    case "void":

      return null;

    default:

      return null;

  }

}



function kdsStatusToPosItem(status: KdsFlowStatus): PosOrderItem["status"] {

  switch (status) {

    case "baru":

      return "fired";

    case "diproces":

      return "cooking";

    case "siap":

      return "ready";

    case "problem":

      return "cooking";

    default:

      return "fired";

  }

}



function buildItemsFromOrder(order: PosOrder): KdsTicketItem[] {

  const ticketId = order.id;

  const items: KdsTicketItem[] = [];



  for (const line of order.items) {

    const kdsSt = posItemToKdsStatus(line.status);

    if (!kdsSt) continue;



    const menuItem = line.menuItemId

      ? store().menuItems.find((m) => m.id === line.menuItemId)

      : undefined;

    const station = (menuItem

      ? resolveKdsStation(menuItem, order.channel)

      : "dapur") as KdsStationId;



    items.push({

      itemId: line.id,

      ticketId,

      menuName: line.nameSnapshot,

      qty: line.qty,

      modifiers: line.modifiersSnapshot.map((m) => m.name),

      notes: line.note,

      status: kdsSt,

      station

    });

  }



  return items;

}



function aggregateTicketStatus(items: KdsTicketItem[]): KdsFlowStatus {

  if (!items.length) return "selesai";

  if (items.every((i) => i.status === "siap")) return "selesai";

  if (items.some((i) => i.status === "problem")) return "problem";

  if (items.some((i) => i.status === "diproces")) return "diproces";

  return "baru";

}



/** Bangun ticket board dari order POS yang sudah di-fire ke dapur. */

export function buildTicketFromOrder(order: PosOrder): KdsOrderTicket | null {

  if (!order.kitchenSentAt) return null;

  if (!KITCHEN_ORDER_STATUS.has(order.status)) return null;



  const items = buildItemsFromOrder(order);

  if (!items.length) return null;

  if (items.every((i) => i.status === "siap")) return null;



  const orderType = channelToKdsOrderType(order.channel, order.outletId);

  const existing = store().kdsBoardTickets.find((t) => t.orderId === order.id);



  return {

    ticketId: order.id,

    orderId: order.id,

    outletId: order.outletId,

    orderType,

    orderNumber: order.orderNumber,

    tableNumber: orderType === "dine_in" ? parseTableNumber(order.tableLabel) : undefined,

    customerName:

      orderType !== "dine_in"

        ? order.customerName ?? order.tableLabel ?? order.orderNumber

        : order.customerName,

    channel: isPlatformChannel(order.outletId, order.channel)

      ? channelDisplayName(order.outletId, order.channel)

      : undefined,

    station: items[0]?.station ?? "dapur",

    status: aggregateTicketStatus(items),

    priority: kdsPriority(order.channel, order.outletId),

    createdAt: order.kitchenSentAt ?? order.createdAt,

    startedAt: existing?.startedAt,

    readyAt: existing?.readyAt,

    notes: order.items.map((i) => i.note).filter(Boolean).join(" · ") || undefined,

    problemReason: existing?.problemReason,

    problemNote: existing?.problemNote,

    items

  };

}



/** Sinkronkan satu order POS → board KDS. */

export function upsertBoardTicketFromOrder(order: PosOrder) {

  ensurePosSeeded();

  const ticket = buildTicketFromOrder(order);

  const s = store();

  const idx = s.kdsBoardTickets.findIndex((t) => t.orderId === order.id);



  if (!ticket) {

    if (idx >= 0) s.kdsBoardTickets.splice(idx, 1);

    return null;

  }



  if (idx >= 0) {

    const prev = s.kdsBoardTickets[idx];

    ticket.startedAt = prev.startedAt ?? ticket.startedAt;

    ticket.problemReason = prev.problemReason;

    ticket.problemNote = prev.problemNote;

    for (const it of ticket.items) {

      const old = prev.items.find((o) => o.itemId === it.itemId);

      if (old?.status === "problem") it.status = "problem";

    }

    ticket.status = aggregateTicketStatus(ticket.items);

    s.kdsBoardTickets[idx] = ticket;

  } else {

    s.kdsBoardTickets.unshift(ticket);

  }



  return ticket;

}



/** Pull semua order POS aktif outlet ke board. */

export function syncKdsBoardFromPos(outletId: string) {

  ensurePosSeeded();

  const activeOrderIds = new Set<string>();



  for (const order of store().posOrders) {

    if (order.outletId !== outletId) continue;

    if (!order.kitchenSentAt) continue;

    if (!KITCHEN_ORDER_STATUS.has(order.status)) continue;



    const ticket = upsertBoardTicketFromOrder(order);

    if (ticket) activeOrderIds.add(order.id);

  }



  store().kdsBoardTickets = store().kdsBoardTickets.filter(

    (t) => t.outletId !== outletId || activeOrderIds.has(t.orderId) || t.ticketId.startsWith("demo-")

  );

}



/** Update status item POS setelah aksi KDS (Proses / Siap). */

export function syncPosItemsFromBoard(

  orderId: string,

  stationId: KdsStationId,

  status: KdsFlowStatus

) {

  ensurePosSeeded();

  const order = store().posOrders.find((o) => o.id === orderId);

  if (!order) return;



  const ticket = store().kdsBoardTickets.find((t) => t.orderId === orderId);

  if (!ticket) return;



  const posStatus = kdsStatusToPosItem(status);



  for (const boardItem of ticket.items.filter((i) => i.station === stationId)) {

    const line = order.items.find((it) => it.id === boardItem.itemId);

    if (line && line.status !== "void") {

      line.status = status === "siap" ? "ready" : posStatus;

    }

  }



  if (ticket.items.every((i) => i.status === "siap")) {

    for (const line of order.items) {

      if (line.status === "ready") line.status = "served";

    }

  }

}

