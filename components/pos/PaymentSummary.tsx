import Link from "next/link";
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
  return (
    <div className="pos-panel flex flex-col p-5">
      <h2 className="text-lg font-black text-navy-900">Ringkasan Bayar</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        {order.orderNumber}
        {order.tableLabel && ` · Meja ${order.tableLabel}`}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="pos-total-box">
          <p className="text-[10px] font-bold uppercase text-slate-500">Total</p>
          <p className="text-base font-black text-navy-900">{formatRp(order.total)}</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/80 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-500">Sudah Bayar</p>
          <p className="text-base font-black text-emerald-800">{formatRp(paid)}</p>
        </div>
        <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3">
          <p className="text-[10px] font-bold uppercase text-slate-500">Sisa</p>
          <p className="text-base font-black text-amber-900">{formatRp(balance)}</p>
        </div>
      </div>

      {order.payments.length > 0 && (
        <div className="mt-4">
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

      {balance > 0 && activeItemCount >= 2 && (
        <div className="mt-4">
          <SplitEqualPanel total={balance} />
        </div>
      )}

      {pendingKitchen > 0 && (
        <form action={sendToKitchenAction} className="mt-4">
          <input type="hidden" name="outletId" value={outletId} />
          <input type="hidden" name="orderId" value={order.id} />
          <input type="hidden" name="returnTo" value="checkout" />
          <button type="submit" className="btn-secondary w-full py-3 text-sm">
            Kirim Dapur ({pendingKitchen} item baru)
          </button>
        </form>
      )}

      <form action={holdOrderAction} className="mt-3 flex gap-2">
        <input type="hidden" name="outletId" value={outletId} />
        <input type="hidden" name="orderId" value={order.id} />
        <input type="hidden" name="returnTo" value="checkout" />
        <input
          name="reason"
          type="text"
          placeholder="Alasan hold (opsional)"
          className="nf3-input min-w-0 flex-1"
        />
        <button type="submit" className="btn-secondary shrink-0 px-4 py-2 text-sm whitespace-nowrap">
          Hold
        </button>
      </form>

      {balance > 0 ? (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {showQuickCash && (
            <QuickCashPanel
              balance={balance}
              outletId={outletId}
              orderId={order.id}
              payAction={payFullAction}
            />
          )}

          <p className="mb-2 text-sm font-bold text-navy-900">
            {showQuickCash ? "Bayar penuh (metode lain)" : "Bayar penuh (1 metode)"}
          </p>
          <div className="mb-4 grid grid-cols-2 gap-2">
            {paymentMethods
              .filter((m) => (showQuickCash ? m.value !== "cash" : true))
              .slice(0, 6)
              .map((m) => (
                <form key={m.value} action={payFullAction}>
                  <input type="hidden" name="outletId" value={outletId} />
                  <input type="hidden" name="orderId" value={order.id} />
                  <input type="hidden" name="method" value={m.value} />
                  <button type="submit" className="btn-primary w-full py-3 text-sm">
                    {m.label}
                    <span className="mt-0.5 block text-[10px] font-semibold opacity-90">
                      {formatRp(balance)}
                    </span>
                  </button>
                </form>
              ))}
          </div>

          <p className="mb-2 text-sm font-bold text-navy-900">Bayar sebagian</p>
          <form action={addPaymentAction} className="grid gap-3">
            <input type="hidden" name="outletId" value={outletId} />
            <input type="hidden" name="orderId" value={order.id} />
            <select name="method" className="nf3-select px-4 py-3 text-base">
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
            <button type="submit" className="btn-secondary w-full py-3 text-base">
              Tambah Pembayaran
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
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
          className="mt-4 block text-center text-xs font-bold text-navy-700 underline"
        >
          Split bill →
        </Link>
      )}
    </div>
  );
}
