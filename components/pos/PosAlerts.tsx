import Link from "next/link";
import { PosPaidEffects } from "./pos-paid-effects";
import { AlertBanner } from "@/components/ui/AlertBanner";

export function PosAlerts({
  searchParams,
  outletId,
  register
}: {
  searchParams: {
    ok?: string;
    error?: string;
    order?: string;
  };
  outletId: string;
  register?: {
    settings?: {
      autoPrintReceipt?: boolean;
      receiptPrinterMode?: string;
      receiptCopies?: number;
    };
  } | null;
}) {
  const { ok, error, order } = searchParams;

  return (
    <div className="shrink-0 space-y-2 px-4 pt-3">
      {ok === "paid" && order && (
        <>
          <PosPaidEffects
            orderId={order}
            outletId={outletId}
            autoPrint={
              register?.settings?.autoPrintReceipt !== false &&
              register?.settings?.receiptPrinterMode !== "none"
            }
            copies={
              register?.settings?.receiptCopies === 2
                ? 2
                : register?.settings?.receiptCopies === 1
                  ? 1
                  : undefined
            }
          />
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Pembayaran berhasil — kas dan stok outlet tercatat.</p>
            <Link
              href={`/pos/receipt/${order}?outlet=${outletId}`}
              className="mt-2 inline-block font-bold text-navy-800 underline"
            >
              Cetak ulang struk
            </Link>
          </div>
        </>
      )}
      {ok === "paid" && !order && (
        <AlertBanner tone="success">
          Pembayaran berhasil. Pesanan selesai — kas dan stok outlet tercatat otomatis.
        </AlertBanner>
      )}
      {ok === "bill-saved" && (
        <AlertBanner tone="success">
          Item ditambahkan ke bill meja. Tambah lagi atau kirim ke dapur / bayar.
        </AlertBanner>
      )}
      {ok === "kitchen-sent" && (
        <AlertBanner tone="info">Pesanan dikirim ke dapur/bar — mulai diproses.</AlertBanner>
      )}
      {ok === "held" && (
        <AlertBanner tone="warning">Bill ditahan. Lanjutkan dari daftar Hold Bill.</AlertBanner>
      )}
      {ok === "resumed" && (
        <AlertBanner tone="success">Bill dilanjutkan — siap tambah item atau bayar.</AlertBanner>
      )}
      {ok === "split" && (
        <AlertBanner tone="info">Bill di-split — ada 2 bill terpisah siap bayar.</AlertBanner>
      )}
      {ok === "merged" && (
        <AlertBanner tone="info">Bill digabung ke satu meja.</AlertBanner>
      )}
      {ok === "shift-closed" && (
        <AlertBanner tone="info">Shift ditutup. Setoran kasir dikirim ke approval leader.</AlertBanner>
      )}
      {ok === "store-closed" && (
        <AlertBanner tone="warning">Toko ditutup untuk hari ini. Tidak bisa buka shift baru.</AlertBanner>
      )}
      {ok === "store-opened" && (
        <AlertBanner tone="success">Toko dibuka — siap buka shift kasir.</AlertBanner>
      )}
      {ok === "voided" && (
        <AlertBanner tone="danger">
          Pesanan dibatalkan. Kas, stok (bila dipilih) & loyalty sudah dikoreksi.
        </AlertBanner>
      )}
      {error && error !== "empty-cart" && <AlertBanner tone="warning">{error}</AlertBanner>}
      {error === "empty-cart" && (
        <AlertBanner tone="warning">Keranjang kosong — tambah menu dulu.</AlertBanner>
      )}
    </div>
  );
}
