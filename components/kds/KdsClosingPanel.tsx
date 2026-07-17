"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ClipboardCheck, Trash2, CheckCircle2 } from "lucide-react";
import type { KdsClosingChecklistItem } from "@/types/inventory";
import { kdsSubmitClosingOpnameAction, kdsSubmitClosingWasteAction } from "@/app/kds-actions";

const WASTE_JENIS = ["Kadaluarsa", "Rusak", "Over Prep", "Salah Masak", "Sisa Closing", "Lainnya"];

export function KdsClosingPanel({
  outletId,
  stationId,
  stationName,
  today,
  checklist,
  optionalChecklist,
  wasteOptions,
  lokasi,
  closingMsg,
  closingError,
  embedded = false
}: {
  outletId: string;
  stationId: string;
  stationName: string;
  today: string;
  checklist: KdsClosingChecklistItem[];
  optionalChecklist: KdsClosingChecklistItem[];
  wasteOptions: Array<{ kodeBahan: string; namaBaku: string; satuanPakai: string }>;
  lokasi: string;
  closingMsg?: string;
  closingError?: string;
  embedded?: boolean;
}) {
  const [open, setOpen] = useState(embedded);
  const [tab, setTab] = useState<"opname" | "waste">("opname");
  const [showOptional, setShowOptional] = useState(false);

  const pendingWajib = useMemo(
    () => checklist.filter((c) => !c.sudahOpnameHariIni).length,
    [checklist]
  );
  const doneWajib = checklist.length - pendingWajib;

  const inner = (
    <>
      {closingMsg && (
        <p className="mb-3 rounded-lg bg-emerald-900/50 px-3 py-2 text-sm font-semibold text-emerald-200">
          {closingMsg}
        </p>
      )}
      {closingError && (
        <p className="mb-3 rounded-lg bg-rose-900/50 px-3 py-2 text-sm font-semibold text-rose-200">
          {closingError}
        </p>
      )}

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("opname")}
          className={`rounded-lg px-3 py-2 text-xs font-bold ${
            tab === "opname" ? "bg-gold-400 text-navy-900" : "bg-navy-800 text-slate-300"
          }`}
        >
          Opname ({checklist.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("waste")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold ${
            tab === "waste" ? "bg-gold-400 text-navy-900" : "bg-navy-800 text-slate-300"
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Waste
        </button>
      </div>

      <p className="mb-3 text-[11px] text-slate-500">
        {stationName} · lokasi <strong className="text-slate-300">{lokasi}</strong> · {today}
      </p>

      {tab === "opname" && (
        <div className="space-y-3">
          {checklist.length === 0 ? (
            <p className="py-4 text-center text-sm text-slate-500">
              Belum ada aturan opname — owner set di Settings → Opname Closing.
            </p>
          ) : (
            checklist.map((item) => (
              <OpnameRow
                key={item.ruleId}
                item={item}
                outletId={outletId}
                stationId={stationId}
              />
            ))
          )}

          {optionalChecklist.length > 0 && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowOptional((v) => !v)}
                className="text-xs font-bold text-slate-400 hover:text-gold-400"
              >
                {showOptional ? "Sembunyikan" : "Tampilkan"} opname opsional (
                {optionalChecklist.length})
              </button>
              {showOptional &&
                optionalChecklist.map((item) => (
                  <OpnameRow
                    key={item.ruleId}
                    item={item}
                    outletId={outletId}
                    stationId={stationId}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {tab === "waste" && (
        <form action={kdsSubmitClosingWasteAction} className="space-y-3">
          <input type="hidden" name="outletId" value={outletId} />
          <input type="hidden" name="station" value={stationId} />
          <input type="hidden" name="lokasi" value={lokasi} />

          <label className="block text-xs font-bold text-slate-300">
            Bahan
            <select name="kodeBahan" required className="kds-field mt-1 w-full">
              <option value="">— pilih —</option>
              {wasteOptions.map((b) => (
                <option key={b.kodeBahan} value={b.kodeBahan}>
                  {b.namaBaku} ({b.satuanPakai})
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-xs font-bold text-slate-300">
              Jumlah
              <input
                name="qty"
                type="number"
                min="0.01"
                step="any"
                required
                placeholder="0"
                className="kds-field mt-1 w-full"
              />
            </label>
            <label className="block text-xs font-bold text-slate-300">
              Jenis
              <select name="jenis" required className="kds-field mt-1 w-full">
                {WASTE_JENIS.map((j) => (
                  <option key={j} value={j}>
                    {j}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-xs font-bold text-slate-300">
            Alasan (singkat)
            <input
              name="alasan"
              type="text"
              required
              placeholder="cth: sisa marinasi tidak layak"
              className="kds-field mt-1 w-full"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-rose-700 py-3 text-sm font-black text-white hover:bg-rose-600"
          >
            Catat Waste
          </button>
        </form>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="rounded-xl border border-navy-700 bg-navy-900 p-4">
        <div className="mb-3">
          <p className="font-bold text-white">Closing Malam — Opname & Waste</p>
          <p className="text-xs text-slate-400">
            {pendingWajib > 0
              ? `${pendingWajib} produk wajib opname · dari HP, tanpa kertas`
              : doneWajib > 0
                ? "Opname wajib selesai — gudang bisa refill malam"
                : "Hitung sisa marinasi/prep & catat waste sebelum pulang"}
          </p>
        </div>
        {inner}
      </div>
    );
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-navy-700 bg-navy-900">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-navy-800"
      >
        <ClipboardCheck className="h-5 w-5 shrink-0 text-gold-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-white">Closing Malam — Opname & Waste</p>
          <p className="text-xs text-slate-400">
            {pendingWajib > 0
              ? `${pendingWajib} produk wajib opname · dari HP, tanpa kertas`
              : doneWajib > 0
                ? "Opname wajib selesai — gudang bisa refill malam"
                : "Hitung sisa marinasi/prep & catat waste sebelum pulang"}
          </p>
        </div>
        {pendingWajib > 0 && (
          <span className="rounded-full bg-amber-600 px-2.5 py-0.5 text-xs font-bold text-white">
            {pendingWajib}
          </span>
        )}
        <ChevronDown
          className={`h-5 w-5 text-slate-400 transition ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && <div className="border-t border-navy-700 px-4 py-3">{inner}</div>}
    </div>
  );
}

function OpnameRow({
  item,
  outletId,
  stationId
}: {
  item: KdsClosingChecklistItem;
  outletId: string;
  stationId: string;
}) {
  if (item.sudahOpnameHariIni) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-950/40 px-3 py-3 ring-1 ring-emerald-800">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" aria-hidden />
        <div>
          <p className="text-sm font-bold text-white">{item.label}</p>
          <p className="text-[11px] text-emerald-300">Opname hari ini selesai</p>
        </div>
      </div>
    );
  }

  return (
    <form
      action={kdsSubmitClosingOpnameAction}
      className="rounded-lg bg-navy-950 px-3 py-3 ring-1 ring-navy-700"
    >
      <input type="hidden" name="outletId" value={outletId} />
      <input type="hidden" name="station" value={stationId} />
      <input type="hidden" name="ruleId" value={item.ruleId} />
      <input type="hidden" name="kodeBahan" value={item.kodeBahan} />
      <input type="hidden" name="lokasi" value={item.lokasi} />

      <p className="text-sm font-bold text-white">{item.label}</p>
      <p className="mb-2 text-[11px] text-slate-500">
        Sistem:{" "}
        <strong className="text-slate-300">
          {formatQty(item.stokSistem)} {item.satuanPakai}
        </strong>
      </p>

      <label className="block text-xs font-bold text-slate-300">
        Stok fisik (hasil hitung)
        <input
          name="stokFisik"
          type="number"
          min="0"
          step="any"
          required
          placeholder="0"
          className="kds-field mt-1 w-full text-lg font-bold"
        />
      </label>

      <button
        type="submit"
        className="mt-2 w-full rounded-lg bg-gold-400 py-2.5 text-xs font-black text-navy-900 hover:bg-gold-500"
      >
        Simpan Opname
      </button>
    </form>
  );
}

function formatQty(n: number) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(2);
}
