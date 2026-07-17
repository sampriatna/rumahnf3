import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export function PosSyncBanner({
  pendingCount,
  outletId
}: {
  pendingCount: number;
  outletId: string;
}) {
  if (pendingCount <= 0) return null;

  return (
    <div
      role="alert"
      className="shrink-0 border-b border-rose-300 bg-rose-600 px-4 py-2.5 text-center text-sm font-bold text-white"
    >
      <Link
        href={`/pos/sync?outlet=${outletId}`}
        className="inline-flex items-center justify-center gap-2 hover:underline"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        {pendingCount} Penjualan belum tersinkronisasi — ketuk untuk sinkronkan
      </Link>
    </div>
  );
}
