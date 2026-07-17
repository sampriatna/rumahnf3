import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { getRegister } from "@/lib/pos-service";
import { AutoPrintOnLoad } from "@/components/pos/auto-print";
import { PrintReceiptButton } from "@/components/pos/print-receipt-button";
import { requirePosSession } from "@/lib/pos-auth";

export default function ReceiptPreviewPage({
  searchParams
}: {
  searchParams: { registerId?: string; outlet?: string; autoprint?: string };
}) {
  requirePosSession();

  const registerId = searchParams.registerId;
  if (!registerId) redirect("/settings/pos");

  const register = getRegister(registerId);
  if (!register) redirect("/settings/pos");

  const outletId = searchParams.outlet ?? register.outletId;
  const outlet = OUTLETS.find((o) => o.id === outletId);
  const settings = register.settings!;
  const widthClass = settings.paperWidthMm === 58 ? "max-w-[58mm]" : "max-w-[80mm]";
  const autoPrint = searchParams.autoprint === "1";

  const sampleItems = [
    { name: "Latte", qty: 2, price: 28_000 },
    { name: "Kentang Goreng", qty: 1, price: 20_000 }
  ];
  const subtotal = 76_000;

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

      <div className="mb-4 print:hidden">
        <Link href={`/settings/pos?outlet=${outletId}&from=pos`} className="text-sm font-bold text-navy-700">
          ← Pengaturan Kasir
        </Link>
      </div>

      <article
        className={`panel mx-auto ${widthClass} p-6 font-mono text-sm print:border-0 print:shadow-none print:p-2`}
      >
        <header className="mb-4 text-center">
          <p className="text-base font-black uppercase tracking-wide text-navy-900">
            {outlet?.name ?? "NF3"}
          </p>
          {settings.receiptHeader && (
            <p className="mt-1 text-xs text-slate-600">{settings.receiptHeader}</p>
          )}
          <p className="text-xs text-slate-500">*** STRUK TEST ***</p>
          <p className="text-[10px] text-slate-400">{register.name}</p>
        </header>

        <hr className="my-3 border-dashed border-slate-300" />

        <ul className="mb-3 space-y-1.5">
          {sampleItems.map((it) => (
            <li key={it.name} className="flex justify-between gap-2">
              <span>
                {it.qty}× {it.name}
              </span>
              <span>{formatRp(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>

        <hr className="my-3 border-dashed border-slate-300" />

        <div className="flex justify-between text-base font-black">
          <span>TOTAL</span>
          <span>{formatRp(subtotal)}</span>
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-500">
          {settings.receiptFooter ?? "Terima kasih"}
        </p>
      </article>

      <div className={`mx-auto mt-4 ${widthClass} print:hidden`}>
        <PrintReceiptButton label="Cetak Test" />
      </div>
    </main>
  );
}
