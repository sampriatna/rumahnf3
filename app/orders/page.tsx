import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { isPosOutlet, POS_OUTLET_IDS } from "@/lib/pos-seed";
import { getOpenShift } from "@/lib/pos-service";
import { listSalesChannels } from "@/lib/channel-service";
import {
  listOutletShiftOrders,
  filterShiftOrders,
  countOrdersByPayment
} from "@/lib/orders-service";
import { UI_FLAGS } from "@/lib/ui-flags";
import { canAccessOutlet } from "@/lib/data-scope";
import { resolvePortalOutletScope } from "@/lib/portal-outlet-scope";
import { OrderCard } from "@/components/orders/OrderCard";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { EmptyState } from "@/components/ui/EmptyState";

const VIEW_ROLES = ["owner", "admin", "leader"];

export default function OrdersPage({
  searchParams
}: {
  searchParams: {
    outlet?: string;
    channel?: string;
    payment?: string;
    status?: string;
  };
}) {
  if (!UI_FLAGS.ordersPageV1) {
    redirect("/dashboard");
  }

  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const outletId = resolvePortalOutletScope(session, searchParams.outlet);

  if (!outletId || !isPosOutlet(outletId)) {
    if (session.role === "owner" || session.role === "admin") {
      return (
        <main className="mx-auto max-w-lg px-5 py-12">
          <h1 className="text-2xl font-black text-navy-900">Pesanan — Pilih Outlet</h1>
          <p className="mt-2 text-slate-600">Pilih outlet F&B untuk melihat pesanan shift aktif.</p>
          <div className="mt-6 grid gap-3">
            {OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id)).map((o) => (
              <Link key={o.id} href={`/orders?outlet=${o.id}`} className="btn-primary py-4">
                {o.name}
              </Link>
            ))}
          </div>
        </main>
      );
    }
    redirect("/dashboard");
  }

  if (!canAccessOutlet(session, outletId)) redirect("/dashboard");

  const outlet = OUTLETS.find((o) => o.id === outletId)!;
  const shift = getOpenShift(outletId);
  const allOrders = listOutletShiftOrders(outletId);
  const filtered = filterShiftOrders(allOrders, {
    channel: searchParams.channel,
    payment: (searchParams.payment as "unpaid" | "partial" | "paid" | "all") ?? "all",
    status: (searchParams.status as "active" | "all" | "open" | "completed" | "held") ?? "active"
  });
  const channels = listSalesChannels(outletId);
  const paymentCounts = countOrdersByPayment(allOrders);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy-900">Pesanan</h1>
        <p className="mt-1 text-sm text-slate-600">
          {outlet.name}
          {shift ? ` · Shift ${shift.shiftLabel}` : " · Tidak ada shift terbuka"}
        </p>
      </header>

      {!shift ? (
        <div className="panel p-8 text-center">
          <p className="font-bold text-navy-900">Shift belum dibuka</p>
          <p className="mt-2 text-sm text-slate-600">Buka shift di POS untuk mulai mencatat pesanan.</p>
          <Link href={`/pos?outlet=${outletId}`} className="btn-primary mt-4 inline-flex px-5 py-3">
            Buka POS
          </Link>
        </div>
      ) : (
        <>
          <Suspense fallback={<div className="mb-4 h-10 animate-pulse rounded-xl bg-slate-100" />}>
            <div className="mb-4 space-y-3">
              <FilterTabs
                param="status"
                tabs={[
                  { id: "active", label: "Aktif", count: filterShiftOrders(allOrders, { status: "active" }).length },
                  { id: "all", label: "Semua", count: allOrders.length },
                  { id: "completed", label: "Selesai", count: allOrders.filter((o) => o.status === "completed").length }
                ]}
              />
              <FilterTabs
                param="payment"
                tabs={[
                  { id: "all", label: "Semua Bayar" },
                  { id: "unpaid", label: "Belum Dibayar", count: paymentCounts.unpaid },
                  { id: "partial", label: "Sebagian", count: paymentCounts.partial },
                  { id: "paid", label: "Lunas", count: paymentCounts.paid }
                ]}
              />
              <FilterTabs
                param="channel"
                tabs={[
                  { id: "all", label: "Semua Channel" },
                  ...channels.map((c) => ({
                    id: c.id,
                    label: c.name,
                    count: allOrders.filter((o) => o.channel === c.id).length
                  }))
                ]}
              />
            </div>
          </Suspense>

          {filtered.length === 0 ? (
            <EmptyState
              title="Tidak ada pesanan untuk filter ini"
              description="Ubah filter status, pembayaran, atau channel — atau buat pesanan baru di POS."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((order) => (
                <OrderCard key={order.id} order={order} outletId={outletId} />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}
