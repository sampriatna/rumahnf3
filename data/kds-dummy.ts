import type { KdsFlowStatus, KdsStationId, KdsOrderTicket } from "@/types/kds";

function ago(minutes: number) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function item(
  ticketId: string,
  id: string,
  menuName: string,
  qty: number,
  station: KdsStationId,
  status: KdsFlowStatus,
  modifiers: string[] = [],
  notes?: string
) {
  return {
    itemId: id,
    ticketId,
    menuName,
    qty,
    modifiers,
    notes,
    status,
    station
  };
}

/** Dummy tickets — variasi order type & multi-station. */
export function buildKdsDummyTickets(outletId: string): KdsOrderTicket[] {
  const t1 = "kds-t-0234";
  const t2 = "kds-t-0235";
  const t3 = "kds-t-0236";
  const t4 = "kds-t-0237";
  const t5 = "kds-t-0238";
  const t6 = "kds-t-0239";

  return [
    {
      ticketId: t1,
      orderId: "ord-0234",
      outletId,
      orderType: "dine_in",
      orderNumber: "KBU-0234",
      tableNumber: "12",
      station: "dapur",
      status: "diproces",
      priority: 0,
      createdAt: ago(8),
      startedAt: ago(6),
      notes: "Tanpa sambal",
      items: [
        item(t1, "i1", "Nasi Goreng KBU", 2, "dapur", "diproces"),
        item(t1, "i2", "Kentang Goreng", 1, "dapur", "baru"),
        item(t1, "i3", "Latte", 2, "bar", "diproces", ["Less ice"]),
        item(t1, "i4", "Espresso", 1, "bar", "baru")
      ]
    },
    {
      ticketId: t2,
      orderId: "ord-0235",
      outletId,
      orderType: "takeaway",
      orderNumber: "KBU-0235",
      customerName: "Budi Santoso",
      station: "bar",
      status: "baru",
      priority: 0,
      createdAt: ago(2),
      items: [
        item(t2, "i1", "Matcha Latte", 2, "bar", "baru", ["Oat milk"]),
        item(t2, "i2", "Teh Tarik", 1, "bar", "baru"),
        item(t2, "i3", "Pisang Goreng", 1, "dapur", "baru")
      ]
    },
    {
      ticketId: t3,
      orderId: "ord-0236",
      outletId,
      orderType: "ojol",
      orderNumber: "KBU-0236",
      customerName: "GoFood #GF8821",
      channel: "GoFood",
      station: "dapur",
      status: "baru",
      priority: 2,
      createdAt: ago(1),
      notes: "Driver sudah di depan",
      items: [
        item(t3, "i1", "Mie Goreng", 1, "dapur", "baru"),
        item(t3, "i2", "Sate Ayam (10 tusuk)", 1, "dapur", "baru"),
        item(t3, "i3", "Cappuccino", 1, "bar", "baru"),
        item(t3, "i4", "Sedotan + tas", 1, "packing", "baru")
      ]
    },
    {
      ticketId: t4,
      orderId: "ord-0237",
      outletId,
      orderType: "ojol",
      orderNumber: "KBU-0237",
      customerName: "GrabFood",
      channel: "GrabFood",
      station: "bar",
      status: "diproces",
      priority: 2,
      createdAt: ago(11),
      startedAt: ago(9),
      items: [
        item(t4, "i1", "V60 Manual Brew", 1, "bar", "diproces"),
        item(t4, "i2", "Kentang Goreng", 1, "dapur", "siap"),
        item(t4, "i3", "Box takeaway", 1, "packing", "baru")
      ]
    },
    {
      ticketId: t5,
      orderId: "ord-0238",
      outletId,
      orderType: "delivery_wa",
      orderNumber: "KBU-0238",
      customerName: "Ibu Sari (WA)",
      station: "dapur",
      status: "baru",
      priority: 1,
      createdAt: ago(16),
      notes: "Alamat: Jl. Melati 5",
      items: [
        item(t5, "i1", "Nasi Goreng KBU", 3, "dapur", "baru"),
        item(t5, "i2", "Air Mineral", 3, "bar", "baru")
      ]
    },
    {
      ticketId: t6,
      orderId: "ord-0239",
      outletId,
      orderType: "dine_in",
      orderNumber: "KBU-0239",
      tableNumber: "7",
      station: "bar",
      status: "problem",
      priority: 0,
      createdAt: ago(4),
      startedAt: ago(3),
      problemReason: "menu_sold_out",
      problemNote: "Matcha habis",
      items: [
        item(t6, "i1", "Matcha Latte", 1, "bar", "problem"),
        item(t6, "i2", "Espresso", 2, "bar", "diproces")
      ]
    }
  ];
}
