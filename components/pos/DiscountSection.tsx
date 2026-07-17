import Link from "next/link";

/** Diskon manual/voucher/promo tersedia saat checkout — bukan di keranjang. */
export function DiscountSection({ orderId, outletId }: { orderId?: string; outletId: string }) {
  const href = orderId
    ? `/pos/checkout/${orderId}?outlet=${outletId}`
    : `/pos?outlet=${outletId}`;

  return (
    <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-600">
      <span className="font-semibold text-navy-800">Diskon & member</span> — terapkan saat{" "}
      <Link href={href} className="font-bold text-navy-700 underline">
        pembayaran / checkout
      </Link>
      (promo, voucher, tier member, poin).
    </div>
  );
}
