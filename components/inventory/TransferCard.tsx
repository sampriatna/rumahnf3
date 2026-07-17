import Link from "next/link";
import { Package } from "lucide-react";
import type { StockTransferRequest } from "@/lib/transfer";
import { TransferStatusBadge } from "./TransferStatusBadge";

function formatTime(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { dateStyle: "medium" });
}

export function TransferCard({ transfer }: { transfer: StockTransferRequest }) {
  return (
    <Link
      href={`/inventory/transfers/${transfer.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-gold-400 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-navy-900 group-hover:text-navy-700">{transfer.requestNumber}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {transfer.fromLocationLabel} → {transfer.toOutletName ?? transfer.toOutletId} ·{" "}
            {formatTime(transfer.createdAt)}
          </p>
          <ul className="mt-2 space-y-0.5 text-sm text-slate-700">
            {transfer.items.map((line, i) => (
              <li key={i} className="flex items-center gap-1.5">
                <Package className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
                {line.itemName} — {line.qty} {line.unit}
              </li>
            ))}
          </ul>
        </div>
        <TransferStatusBadge status={transfer.status} />
      </div>
    </Link>
  );
}

export function TransferPipeline() {
  const steps = [
    { n: 1, label: "Ajukan", desc: "Leader minta barang" },
    { n: 2, label: "Kirim", desc: "Gudang proses" },
    { n: 3, label: "Terima", desc: "Outlet konfirmasi" }
  ] as const;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      {steps.map((step, i) => (
        <div key={step.n} className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
            {step.n}
          </span>
          <div className="text-xs">
            <p className="font-bold text-navy-900">{step.label}</p>
            <p className="text-slate-500">{step.desc}</p>
          </div>
          {i < steps.length - 1 && (
            <span className="mx-1 hidden text-slate-300 sm:inline" aria-hidden>
              →
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
