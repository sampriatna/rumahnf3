"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatRp } from "@/lib/finance";
import type { PosOrder } from "@/lib/pos-kds-roadmap";
import { paymentMethodDisplayName } from "@/lib/payment-method-service";
import {
  addPaymentAction,
  payFullAction,
  completeZeroOrderAction,
  sendToKitchenAction,
  holdOrderAction
} from "@/app/pos-actions";
import { QuickCashPanel } from "./quick-cash";
import { SplitEqualPanel } from "./split-equal";

export function PaymentSummary({
  order,
  outletId,
  balance,
  paid,
  paymentMethods,
  showQuickCash,
  payOutletId,
  pendingKitchen,
  activeItemCount
}: {
  order: PosOrder;
  outletId: string;
  balance: number;
  paid: number;
  paymentMethods: Array<{ value: string; label: string }>;
  showQuickCash: boolean;
  payOutletId: string;
  pendingKitchen: number;
  activeItemCount: number;
}) {
  const defaultMethod = useMemo(() => {
    if (showQuickCash && paymentMethods.some((m) => m.value === "cash")) return "cash";
    return paymentMethods[0]?.value ?? "cash";
  }, [paymentMethods, showQuickCash]);

  const [method, setMethod] = useState(defaultMethod);
  const isCash = method === "cash";

  return (
    <div className="pos-panel flex max-h-[calc(100vh-5.5rem)] flex-col overflow-hidden">
      <div className="shrink-0 border-b border-slate-100 px-5 py-4">
        <h2 className="text-lg font-black text-navy-900">Ringkasan Bayar</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          {order.orderNumber}
          {order.tableLabel && ` · Meja ${order.tableLabel}`}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="pos-total-box !p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Total</p>
            <p className="text-base font-black text-navy-900">{formatRp(order.total)}</p>
          </div>
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Sudah Bayar</p>
            <p className="text-base font-black text-emerald-800">{formatRp(paid)}</p>
          </div>
          <div className="rounded-xl border border-gold-100 bg-gold-100/40 p-3">
            <p className="text-[10px] font-bold uppercase text-slate-500">Sisa</p>
            <p className="text-base font-black text-navy-900">{formatRp(balance)}</p>
          </div>
        </div>

        {order.payments.length > 0 && (
          <div>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Riwayat Pembayaran
            </p>
            <ul className="space-y-1 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-2 text-sm">
              {order.payments.map((p) => (
                <li
                  key={p.id}
                  className={`flex justify-between ${
                    p.status === "refunded" ? "text-rose-700" : "text-slate-700"
                  }`}
                >
                  <span>
                    {payOutletId ? paymentMethodDisplayName(payOutletId, p.method) : p.method}
                    {p.status === "refunded" && (
                      <span className="ml-1 text-[10px] font-bold uppercase">· Dikembalikan</span>
                    )}
                  </span>
                  <span className="font-semibold">{formatRp(p.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {balance > 0 && activeItemCount >= 2 && <SplitEqualPanel total={balance} />}

        {pendingKitchen > 0 && (
          <form action={sendToKitchenAction}>
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="returnTo" value="checkout" />
            <button type="submit" className="btn-secondary w-full py-3 text-sm">
              Kirim Dapur ({pendingKitchen} item baru)
            </button>
          </form>
        )}

        <form action={holdOrderAction} className="flex gap-2">
          <input type="hidden" name="outletId" value={outletId} />
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="returnTo" value="checkout" />
          <input
            name="reason"
            type="text"
            placeholder="Alasan tahan (opsional)"
            className="nf3-input min-w-0 flex-1"
          />
          <button type="submit" className="btn-secondary shrink-0 px-4 py-2 text-sm whitespace-nowrap">
            Tahan
          </button>
        </form>

        {balance > 0 ? (
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-sm font-bold text-navy-900">Metode Bayar</p>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.slice(0, 6).map((m) => {
                  const active = method === m.value;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setMethod(m.value)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition ${
                        active
                          ? "border-navy-800 bg-navy-800 text-white shadow-sm"
                          : "border-slate-200 bg-white text-navy-900 hover:border-gold-400"
                      }`}
                    >
                      {m.label}
                      {active && (
                        <span
                          className={`mt-0.5 block text-[10px] font-semibold ${
                            active ? "text-gold-400" : "text-slate-400"
                          }`}
                        >
                          Dipilih
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {showQuickCash && isCash && (
              <QuickCashPanel
                balance={balance}
                outletId={outletId}
                orderId={order.id}
                payAction={payFullAction}
                hideSubmit
              />
            )}

            <details className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2">
              <summary className="cursor-pointer text-xs font-bold text-slate-600">
                Bayar sebagian
              </summary>
              <form action={addPaymentAction} className="mt-3 grid gap-3">
                <input type="hidden" name="outletId" value={outletId} />
                <input type="hidden" name="orderId" value={order.id} />
                <select name="method" className="nf3-select px-4 py-3 text-base" defaultValue={method}>
                  {paymentMethods.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <input
                  name="amount"
                  type="number"
                  required
                  min={1}
                  max={balance}
                  defaultValue={balance}
                  className="nf3-input px-4 py-3 text-base"
                />
                <input
                  name="reference"
                  type="text"
                  placeholder="No. referensi (opsional)"
                  className="nf3-input px-4 py-3"
                />
                <button type="submit" className="btn-secondary w-full py-3 text-sm">
                  Tambah Pembayaran
                </button>
              </form>
            </details>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
            Order bernilai Rp0 (100% reward). Selesaikan untuk catat stok & loyalty.
            <form action={completeZeroOrderAction} className="mt-2">
              <input type="hidden" name="outletId" value={outletId} />
              <input type="hidden" name="orderId" value={order.id} />
              <button type="submit" className="pos-cta-primary py-3 text-sm">
                Selesaikan Order
              </button>
            </form>
          </div>
        )}

        {order.status === "open" && order.items.length >= 2 && order.paymentStatus !== "partial" && (
          <Link
            href={`/pos/split/${order.id}?outlet=${outletId}`}
            className="block text-center text-xs font-bold text-navy-700 underline"
          >
            Pisah bill →
          </Link>
        )}
      </div>

      {balance > 0 && (
        <div className="pos-checkout-sticky shrink-0 border-t border-slate-100 bg-white px-5 py-4">
          <form action={payFullAction} className="grid gap-2">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="orderId" value={order.id} />
            <input type="hidden" name="method" value={method} />
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Jumlah dibayar
              </span>
              <span className="text-xl font-black text-navy-900">{formatRp(balance)}</span>
            </div>
            <button type="submit" className="pos-cta-primary">
              Bayar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
