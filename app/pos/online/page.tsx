import Link from "next/link";
import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { formatRp } from "@/lib/finance";
import { isPosOutlet } from "@/lib/pos-seed";
import {
  getOpenShift,
  getMenuForOutlet,
  listOnlinePendingOrders
} from "@/lib/pos-service";
import { createOnlineOrderAction } from "../../pos-actions";
import { requirePosSession } from "@/lib/pos-auth";
import { UI_FLAGS } from "@/lib/ui-flags";
import { PosSubPageShell } from "@/components/pos/PosSubPageShell";
import { PosSubPageAlerts } from "@/components/pos/PosSubPageAlerts";

const PLATFORMS = [
  { value: "gofood", label: "GoFood" },
  { value: "grab", label: "GrabFood" },
  { value: "shopee", label: "ShopeeFood" }
];

export default function PosOnlinePage({
  searchParams
}: {
  searchParams: { outlet?: string; error?: string; ok?: string };
}) {
  const session = requirePosSession();

  const outletId =
    searchParams.outlet && (session.role === "owner" || session.role === "admin")
      ? searchParams.outlet
      : session.outletId ?? searchParams.outlet;

  if (!outletId || !isPosOutlet(outletId)) redirect("/pos");

  const shift = getOpenShift(outletId);
  if (!shift) redirect(`/pos?outlet=${outletId}`);

  const outlet = OUTLETS.find((o) => o.id === outletId)!;
  const { items } = getMenuForOutlet(outletId);
  const pending = listOnlinePendingOrders(shift.id);
  const popular = items.slice(0, 8);
  const useV2 = UI_FLAGS.posLayoutV2;

  const content = (
    <>
      <p className="text-sm text-slate-600">
        Input manual dari GoFood / Grab / Shopee — integrasi API belum tersedia.
      </p>
      <PosSubPageAlerts error={searchParams.error} ok={searchParams.ok} />

      {pending.length > 0 && (
        <section className={`mt-4 ${useV2 ? "pos-panel" : "panel"} p-4`}>
          <h2 className="text-sm font-bold uppercase text-slate-500">
            Menunggu bayar ({pending.length})
          </h2>
          <ul className="mt-3 space-y-2">
            {pending.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/pos/checkout/${o.id}?outlet=${outletId}`}
                  className="pos-cart-line hover:border-gold-400/50"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-navy-900">
                      {o.externalPlatform?.toUpperCase()} · {o.externalOrderId}
                    </p>
                    <p className="text-xs text-slate-500">
                      {o.orderNumber}
                      {o.customerName ? ` · ${o.customerName}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold text-gold-700">{formatRp(o.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <form
        action={createOnlineOrderAction}
        className={`mt-4 grid gap-4 ${useV2 ? "pos-panel" : "panel"} p-6`}
      >
        <input type="hidden" name="outletId" value={outletId} />
        <input type="hidden" name="shiftId" value={shift.id} />
        <div>
          <label htmlFor="platform" className="nf3-field-label">
            Platform
          </label>
          <select id="platform" name="platform" className="nf3-select mt-1 py-3 text-sm">
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="externalOrderId" className="nf3-field-label">
            ID Order Platform *
          </label>
          <input
            id="externalOrderId"
            name="externalOrderId"
            required
            placeholder="GF-123456 / GRB-789"
            className="nf3-input mt-1 py-3 text-sm"
          />
        </div>
        <div>
          <label htmlFor="onlineCustomer" className="nf3-field-label">
            Nama pelanggan
          </label>
          <input
            id="onlineCustomer"
            name="customerName"
            placeholder="Opsional"
            className="nf3-input mt-1 py-3 text-sm"
          />
        </div>
        <fieldset>
          <legend className="nf3-field-label">Item pesanan</legend>
          <ul className="mt-2 space-y-2">
            {popular.map((item) => (
              <li key={item.id} className="pos-cart-line">
                <span className="min-w-0 flex-1 text-sm font-semibold">{item.name}</span>
                <input
                  type="number"
                  name={`qty_${item.id}`}
                  min={0}
                  defaultValue={0}
                  className="w-14 rounded-lg border border-slate-200 px-2 py-1 text-center text-sm"
                />
                <span className="text-xs font-bold text-gold-700">{formatRp(item.basePrice)}</span>
              </li>
            ))}
          </ul>
        </fieldset>
        <button type="submit" className={useV2 ? "pos-cta-primary" : "btn-primary w-full py-4 text-base"}>
          Terima & Kirim Dapur
        </button>
      </form>
    </>
  );

  if (useV2) {
    return (
      <PosSubPageShell
        outletId={outletId}
        outletName={outlet.name}
        shiftLabel={shift.shiftLabel}
        title="Order Online"
        subtitle="GoFood · Grab · Shopee (manual)"
        width="md"
      >
        {content}
      </PosSubPageShell>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-5 py-8 pb-24">
      <Link href={`/pos?outlet=${outletId}`} className="text-sm font-bold text-navy-700">
        ← POS
      </Link>
      <h1 className="mt-2 text-xl font-black text-navy-900">Order Online · {outlet.name}</h1>
      {content}
    </main>
  );
}
