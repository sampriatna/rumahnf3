"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Info, Warehouse } from "lucide-react";
import type { MasterLokasi } from "@/types/inventory";

export function InventoryLocationGuide({ lokasiList }: { lokasiList: MasterLokasi[] }) {
  const [open, setOpen] = useState(false);
  const warehouse = lokasiList.find((l) => l.kode === "GDG");
  const outlets = lokasiList.filter((l) => l.kode !== "GDG");

  return (
    <div className="mb-6 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <span className="mr-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Lokasi
        </span>
        {warehouse && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-900">
            <Warehouse className="h-3 w-3 text-navy-600" aria-hidden />
            <span className="font-mono font-extrabold">{warehouse.kode}</span>
            {warehouse.namaLokasi}
          </span>
        )}
        {outlets.map((loc) => (
          <span
            key={loc.kode}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-[#FBF8F0] px-3 py-1 text-xs font-semibold text-slate-700"
          >
            <span className="font-mono font-extrabold text-[#883224]">{loc.kode}</span>
            {loc.namaLokasi}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-bold text-slate-500 hover:bg-slate-50 hover:text-navy-800"
        >
          <Info className="h-3 w-3" aria-hidden />
          Rumus saldo
          {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600">
          <p>
            <strong>Saldo</strong> = opname awal + barang masuk + transfer masuk − pemakaian − waste −
            transfer keluar.
          </p>
          <p className="mt-1.5">
            POS hanya mengurangi stok outlet. Isi ulang lewat{" "}
            <Link href="/inventory/transfers" className="font-bold text-navy-800 underline">
              Transfer
            </Link>{" "}
            dari GDG.
          </p>
        </div>
      )}
    </div>
  );
}
