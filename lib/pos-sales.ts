import { isSameIsoDay } from "./date-format";
import { isSupabaseConfigured, supabaseAdmin } from "./supabase";
import { store } from "./store";
import type { PosOrder } from "./pos-kds-roadmap";

export type PosSalesToday = {
  total: number;
  orderCount: number;
  source: "supabase" | "memory";
};

function orderPaidToday(order: PosOrder, today: string): boolean {
  return (
    order.paymentStatus === "paid" &&
    order.status === "completed" &&
    isSameIsoDay(order.paidAt ?? order.completedAt ?? order.createdAt, today)
  );
}

function sumPaidToday(orders: PosOrder[], today: string): PosSalesToday {
  const paid = orders.filter((order) => orderPaidToday(order, today));
  return {
    total: paid.reduce((sum, order) => sum + order.total, 0),
    orderCount: paid.length,
    source: "memory"
  };
}

/** Penjualan POS hari ini — Supabase pos_orders, fallback in-memory store. */
export async function getPosSalesToday(today: string): Promise<PosSalesToday> {
  if (isSupabaseConfigured()) {
    try {
      const db = supabaseAdmin();
      const { data, error } = await db
        .from("pos_orders")
        .select("total,payment_status,status,paid_at,completed_at,created_at")
        .eq("payment_status", "paid")
        .eq("status", "completed");

      if (!error && data?.length) {
        const paid = data.filter((row) => {
          const at = String(row.paid_at ?? row.completed_at ?? row.created_at ?? "");
          return at && isSameIsoDay(at, today);
        });
        return {
          total: paid.reduce((sum, row) => sum + (Number(row.total) || 0), 0),
          orderCount: paid.length,
          source: "supabase"
        };
      }
    } catch {
      /* fallback memory */
    }
  }

  return sumPaidToday(store().posOrders, today);
}
