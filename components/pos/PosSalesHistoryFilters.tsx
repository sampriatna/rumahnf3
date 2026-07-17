import { Search } from "lucide-react";
import { getPosBusinessDate } from "@/lib/pos-store-day";

export function PosSalesHistoryFilters({
  outletId,
  date,
  q,
  status,
  payment
}: {
  outletId: string;
  date: string;
  q?: string;
  status?: string;
  payment?: string;
}) {
  const today = getPosBusinessDate();

  return (
    <form
      method="get"
      action="/pos/history"
      className="pos-panel grid gap-3 p-4 sm:grid-cols-2"
    >
      <input type="hidden" name="outlet" value={outletId} />
      <div className="sm:col-span-2">
        <label htmlFor="historyDate" className="nf3-field-label">
          Tanggal
        </label>
        <input
          id="historyDate"
          name="date"
          type="date"
          defaultValue={date}
          max={today}
          className="nf3-input mt-1 font-semibold"
        />
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="historyQ" className="nf3-field-label">
          Cari no. transaksi / meja
        </label>
        <div className="relative mt-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id="historyQ"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Mis. ORD-001 atau A3"
            className="nf3-input w-full pl-9 font-semibold"
          />
        </div>
      </div>
      <div>
        <label htmlFor="historyStatus" className="nf3-field-label">
          Status
        </label>
        <select
          id="historyStatus"
          name="status"
          defaultValue={status ?? "all"}
          className="nf3-select mt-1 font-semibold"
        >
          <option value="all">Semua</option>
          <option value="active">Aktif (belum selesai)</option>
          <option value="completed">Selesai</option>
          <option value="open">Terbuka</option>
          <option value="held">Ditahan</option>
          <option value="void">Void</option>
        </select>
      </div>
      <div>
        <label htmlFor="historyPayment" className="nf3-field-label">
          Pembayaran
        </label>
        <select
          id="historyPayment"
          name="payment"
          defaultValue={payment ?? "all"}
          className="nf3-select mt-1 font-semibold"
        >
          <option value="all">Semua</option>
          <option value="unpaid">Belum bayar</option>
          <option value="partial">Sebagian</option>
          <option value="paid">Lunas</option>
        </select>
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="pos-cta-primary text-sm">
          Tampilkan
        </button>
      </div>
    </form>
  );
}

export function PosSalesRecapForm({
  outletId,
  from,
  to
}: {
  outletId: string;
  from: string;
  to: string;
}) {
  const today = getPosBusinessDate();

  return (
    <form method="get" action="/pos/recap" className="pos-panel grid gap-3 p-4 sm:grid-cols-2">
      <input type="hidden" name="outlet" value={outletId} />
      <div>
        <label htmlFor="recapFrom" className="nf3-field-label">
          Dari tanggal
        </label>
        <input
          id="recapFrom"
          name="from"
          type="date"
          required
          defaultValue={from}
          max={today}
          className="nf3-input mt-1 font-semibold"
        />
      </div>
      <div>
        <label htmlFor="recapTo" className="nf3-field-label">
          Sampai tanggal
        </label>
        <input
          id="recapTo"
          name="to"
          type="date"
          required
          defaultValue={to}
          max={today}
          className="nf3-input mt-1 font-semibold"
        />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="pos-cta-primary text-sm">
          Cari Rekapitulasi
        </button>
      </div>
    </form>
  );
}
