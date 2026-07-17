import { AlertBanner } from "@/components/ui/AlertBanner";

export function PosSubPageAlerts({
  error,
  ok,
  table
}: {
  error?: string;
  ok?: string;
  table?: string;
}) {
  if (!error && !ok) return null;

  return (
    <div className="mb-4 space-y-2">
      {error && (
        <AlertBanner tone="warning">
          {error.includes("%") ? decodeURIComponent(error) : error}
        </AlertBanner>
      )}
      {ok === "moved" && table && (
        <AlertBanner tone="success">Bill dipindah ke meja {table}.</AlertBanner>
      )}
      {ok === "recorded" && (
        <AlertBanner tone="success">Catatan laci tersimpan.</AlertBanner>
      )}
      {ok === "expense-saved" && (
        <AlertBanner tone="success">Pengeluaran outlet tersimpan.</AlertBanner>
      )}
      {ok === "store-closed" && (
        <AlertBanner tone="success">Toko ditutup untuk hari ini.</AlertBanner>
      )}
      {ok === "store-opened" && (
        <AlertBanner tone="success">Toko dibuka — siap buka shift.</AlertBanner>
      )}
      {ok === "deposit-topped" && (
        <AlertBanner tone="success">Top-up deposit berhasil.</AlertBanner>
      )}
      {ok === "clock-in" && <AlertBanner tone="success">Clock-in berhasil.</AlertBanner>}
      {ok === "clock-out" && <AlertBanner tone="success">Clock-out berhasil.</AlertBanner>}
    </div>
  );
}
