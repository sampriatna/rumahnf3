import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { getOrder, getRegister, getShift, recordReprint } from "@/lib/pos-service";
import { PrintReceiptButton } from "@/components/pos/print-receipt-button";
import { AutoPrintOnLoad } from "@/components/pos/auto-print";
import { channelDisplayName } from "@/lib/channel-service";
import { requirePosSession } from "@/lib/pos-auth";

export default function PosReceiptPage({
  params,
  searchParams
}: {
  params: { orderId: string };
  searchParams: { outlet?: string; autoprint?: string };
}) {
  const session = requirePosSession();

  const order = getOrder(params.orderId);
  if (!order) redirect("/pos");

  const outletId = searchParams.outlet ?? order.outletId;
  const autoPrint = searchParams.autoprint === "1";
  if (!autoPrint) {
    recordReprint(params.orderId, session.name);
  }
  const outlet = OUTLETS.find((o) => o.id === outletId);
  const paid = order.payments
    .filter((p) => p.status === "captured")
    .reduce((s, p) => s + p.amount, 0);

  const dt = new Date(order.completedAt ?? order.paidAt ?? order.createdAt);
  const shift = order.shiftId ? getShift(order.shiftId) : undefined;
  const register = shift ? getRegister(shift.registerId) : undefined;
  const settings = register?.settings;
  const widthClass =
    settings?.paperWidthMm === 58 ? "max-w-[58mm] print:max-w-[58mm]" : "max-w-[80mm] print:max-w-[80mm]";

  return (
    <main className="mx-auto max-w-sm px-4 py-6 print:max-w-none print:p-0">
      <AutoPrintOnLoad active={autoPrint} />
      <style>{`
        @media print {
          body * { visibility: hidden; }
          main, main * { visibility: visible; }
          main { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <div className="mb-4 flex gap-2 print:hidden">
        <Link href={`/pos?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
          ← POS
        </Link>
      </div>

      <article
        className={`panel mx-auto ${widthClass} p-6 font-mono text-sm print:border-0 print:shadow-none print:p-2`}
      >
        <header className="mb-4 text-center">
          <p className="text-base font-black uppercase tracking-wide text-navy-900">
            {outlet?.name ?? "NF3"}
          </p>
          {settings?.receiptHeader && (
            <p className="mt-1 text-xs text-slate-600">{settings.receiptHeader}</p>
          )}
          <p className="text-xs text-slate-600">Struk Penjualan</p>
        </header>

        <div className="mb-3 space-y-0.5 text-xs">
          <p>No: {order.orderNumber}</p>
          <p>
            {dt.toLocaleDateString("id-ID")} {dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </p>
          <p>Channel: {channelDisplayName(order.outletId, order.channel)}</p>
          {order.tableLabel && <p>Meja: {order.tableLabel}</p>}
          {(order.reprintCount ?? 0) > 0 && (
            <p className="font-bold text-amber-700">CETAK ULANG #{order.reprintCount}</p>
          )}
          {order.memberCode && <p>Member: {order.memberCode}</p>}
          <p>Kasir: {order.createdBy ?? "—"}</p>
        </div>

        <hr className="my-3 border-dashed border-slate-300" />

        <ul className="mb-3 space-y-1.5">
          {order.items.map((it) => (
            <li key={it.id}>
              <div className="flex justify-between gap-2">
                <span className="min-w-0 flex-1">
                  {it.qty}× {it.nameSnapshot}
                </span>
                <span>{it.isRewardItem ? "GRATIS" : formatRp(it.lineTotal)}</span>
              </div>
            </li>
          ))}
        </ul>

        <hr className="my-3 border-dashed border-slate-300" />

        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRp(order.subtotal)}</span>
          </div>
          {(order.discountAmount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span>Diskon</span>
              <span>− {formatRp(order.discountAmount)}</span>
            </div>
          )}
          {(order.totalManualDiscount ?? 0) > 0 && order.manualDiscountApprovedBy && (
            <p className="text-[10px] text-slate-500">
              Diskon manual · {order.manualDiscountApprovedBy}
              {order.manualDiscountNote ? ` · ${order.manualDiscountNote}` : ""}
            </p>
          )}
          <div className="flex justify-between text-base font-black">
            <span>TOTAL</span>
            <span>{formatRp(order.total)}</span>
          </div>
        </div>

        {order.payments.length > 0 && (
          <>
            <hr className="my-3 border-dashed border-slate-300" />
            <div className="space-y-1 text-xs">
              <p className="font-bold">Pembayaran</p>
              {order.payments.map((p) => (
                <div key={p.id} className="flex justify-between uppercase">
                  <span>{p.method}</span>
                  <span>{formatRp(p.amount)}</span>
                </div>
              ))}
              {paid >= order.total && (
                <div className="flex justify-between font-bold">
                  <span>LUNAS</span>
                  <span>{formatRp(paid)}</span>
                </div>
              )}
            </div>
          </>
        )}

        <p className="mt-6 text-center text-[10px] text-slate-500">
          {settings?.receiptFooter ?? "Terima kasih · Rumah NF3"}
        </p>
      </article>

      <div className={`mx-auto mt-4 ${widthClass} print:hidden`}>
        <PrintReceiptButton />
      </div>
    </main>
  );
}
