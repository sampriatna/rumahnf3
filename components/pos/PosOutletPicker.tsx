import Link from "next/link";
import { OUTLETS } from "@/lib/mock-data";
import { POS_OUTLET_IDS } from "@/lib/pos-seed";
import { PosExitLink } from "./PosExitLink";

export function PosOutletPicker() {
  const outlets = OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id));

  return (
    <div className="pos-shell flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-lg">
        <PosExitLink className="text-xs font-bold uppercase tracking-wide text-slate-400" />
        <div className="pos-panel mt-4 p-6">
          <h1 className="text-2xl font-black text-navy-900">Pilih Outlet Kasir</h1>
          <p className="mt-2 text-sm text-slate-600">Pilih outlet F&B untuk membuka shift dan melayani pesanan.</p>
          <div className="mt-6 grid gap-3">
            {outlets.map((o) => (
              <Link
                key={o.id}
                href={`/pos?outlet=${o.id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-4 font-bold text-navy-900 transition hover:border-gold-400 hover:bg-navy-50"
              >
                {o.name}
                <span className="text-xs font-semibold text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
