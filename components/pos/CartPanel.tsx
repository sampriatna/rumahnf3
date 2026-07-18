import { ShoppingCart } from "lucide-react";
import { formatRp } from "@/lib/finance";
import type { PosCartLine } from "@/lib/store";
import type { SalesChannel } from "@/lib/channel-service";
import type { PosOutletConfig } from "@/lib/pos-outlet-config";
import type { PosOrder } from "@/lib/pos-kds-roadmap";
import type { FloorTable } from "@/lib/pos-floor";
import { clearCartAction, resumeOrderAction } from "@/app/pos-actions";
import { CartItem } from "./CartItem";
import { CartOrderForm } from "./CartOrderForm";
import type { PosWaiterOption } from "@/lib/pos-waiter-service";
import { EmptyState } from "@/components/ui/EmptyState";

export function CartPanel({
  outletId,
  shiftId,
  cart,
  cartTotal,
  channels,
  posCfg,
  floorTables,
  defaultTable,
  waiters = []
}: {
  outletId: string;
  shiftId: string;
  cart: PosCartLine[];
  cartTotal: number;
  channels: SalesChannel[];
  posCfg: PosOutletConfig;
  floorTables: FloorTable[];
  defaultTable?: string;
  waiters?: PosWaiterOption[];
}) {
  const itemCount = cart.reduce((s, l) => s + l.qty, 0);

  return (
    <div className="pos-panel flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2 border-b border-slate-100 px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-50 text-navy-800">
          <ShoppingCart className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-navy-900">Ringkasan Order</h2>
          <p className="text-[11px] text-slate-500">{itemCount} item di keranjang</p>
        </div>
        <span className="rounded-lg bg-navy-800 px-2.5 py-1 text-xs font-bold text-gold-400">
          {itemCount}
        </span>
      </div>

      {cart.length === 0 ? (
        <EmptyState
          title="Order kosong"
          description="Tap produk di katalog untuk menambahkan item."
          className="border-0 bg-transparent py-10 shadow-none"
        />
      ) : (
        <>
          <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
            {cart.map((line) => (
              <CartItem key={line.lineId} line={line} outletId={outletId} shiftId={shiftId} />
            ))}
          </ul>

          <div className="pos-checkout-sticky shrink-0 border-t border-slate-100 bg-white px-4 pb-4 pt-3">
            <div className="pos-total-box mb-3">
              <div className="flex items-end justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total</p>
                <p className="text-2xl font-black text-navy-900">{formatRp(cartTotal)}</p>
              </div>
            </div>

            <form action={clearCartAction} className="mb-2">
              <input type="hidden" name="outletId" value={outletId} />
              <input type="hidden" name="shiftId" value={shiftId} />
              <button type="submit" className="w-full py-1.5 text-center text-xs font-semibold text-slate-500 underline-offset-2 hover:text-navy-800 hover:underline">
                Kosongkan Keranjang
              </button>
            </form>

            <CartOrderForm
              outletId={outletId}
              shiftId={shiftId}
              channels={channels}
              posCfg={posCfg}
              floorTables={floorTables}
              defaultTable={defaultTable}
              openBillMode={posCfg.openBillMode}
              waiters={waiters}
            />
          </div>
        </>
      )}
    </div>
  );
}

export function OpenBillsPanel({
  outletId,
  openBills,
  heldBills,
  posCfg,
  billsInStrip = false
}: {
  outletId: string;
  openBills: PosOrder[];
  heldBills: PosOrder[];
  posCfg: PosOutletConfig;
  billsInStrip?: boolean;
}) {
  if (!posCfg.openBillMode) return null;

  const showOpen = !billsInStrip && openBills.length > 0;
  const showHeld = heldBills.length > 0;
  if (!showOpen && !showHeld) return null;

  return (
    <>
      {showHeld && (
        <div className="pos-panel shrink-0 p-4">
          <h3 className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Bill Ditahan
          </h3>
          <ul className="space-y-2 text-sm">
            {heldBills.map((o) => (
              <li key={o.id} className="rounded-xl border border-amber-100 bg-amber-50/50 px-3 py-2">
                <p className="font-bold text-navy-900">
                  Meja {o.tableLabel ?? "Tanpa nomor"} · {o.orderNumber}
                </p>
                <p className="text-xs text-slate-600">
                  {formatRp(o.total)}
                  {o.holdReason && ` · ${o.holdReason}`}
                </p>
                <form action={resumeOrderAction} className="mt-2">
                  <input type="hidden" name="outletId" value={outletId} />
                  <input type="hidden" name="orderId" value={o.id} />
                  <button type="submit" className="btn-primary px-3 py-1.5 text-xs">
                    Lanjutkan
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
