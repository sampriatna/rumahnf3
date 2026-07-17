import { CloudUpload, RefreshCw } from "lucide-react";
import { syncPosAction } from "@/app/pos-actions";
import type { PosSyncQueueItem } from "@/lib/pos-kds-roadmap";
import { getPosDeviceLabel } from "@/lib/pos-device";

const ACTION_LABEL: Record<PosSyncQueueItem["action"], string> = {
  create: "Buat",
  update: "Ubah",
  complete: "Selesai"
};

const ENTITY_LABEL: Record<PosSyncQueueItem["entity"], string> = {
  order: "Order",
  shift: "Shift"
};

export function PosSyncPanel({
  outletId,
  deviceId,
  summary,
  ok,
  error
}: {
  outletId: string;
  deviceId?: string;
  summary: {
    penjualan: number;
    shift: number;
    total: number;
    items: PosSyncQueueItem[];
  };
  ok?: string;
  error?: string;
}) {
  const deviceLabel = getPosDeviceLabel(undefined, outletId, deviceId);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <section className="pos-panel p-4">
        <h2 className="text-sm font-bold text-navy-900">Status Perangkat</h2>
        <p className="mt-2 text-sm text-slate-600">
          Perangkat ini: <span className="font-bold text-navy-800">{deviceLabel}</span>
          {deviceId && (
            <span className="mt-1 block font-mono text-[11px] text-slate-400">{deviceId}</span>
          )}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          ID perangkat disimpan di cookie browser tablet. Transaksi baru ditandai pending sampai
          berhasil di-push ke cloud.
        </p>
      </section>

      {ok === "synced" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          Sinkronisasi berhasil.
        </p>
      )}
      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </p>
      )}

      <section className="pos-panel p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Antrean Belum Tersinkron
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Penjualan
            </p>
            <p className="text-2xl font-black text-navy-900">{summary.penjualan}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Shift</p>
            <p className="text-2xl font-black text-navy-900">{summary.shift}</p>
          </div>
        </div>

        {summary.total === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3 py-6 text-center text-sm text-slate-500">
            Semua data sudah tersinkronisasi.
          </p>
        ) : (
          <>
            <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
              {summary.items.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-3 py-2"
                >
                  <span>
                    <span className="font-semibold text-navy-800">
                      {ENTITY_LABEL[item.entity]}
                    </span>{" "}
                    <span className="font-mono text-xs text-slate-500">{item.entityId}</span>
                  </span>
                  <span className="text-xs font-bold uppercase text-slate-500">
                    {ACTION_LABEL[item.action]}
                  </span>
                </li>
              ))}
            </ul>

            <form action={syncPosAction} className="mt-4">
              <input type="hidden" name="outletId" value={outletId} />
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-navy-800 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-navy-900"
              >
                <CloudUpload className="h-4 w-4" aria-hidden />
                Sinkronkan {summary.total} item
              </button>
            </form>
          </>
        )}
      </section>

      <p className="flex items-start gap-2 text-xs text-slate-500">
        <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        Data lokal tetap tersimpan di server aplikasi. Sinkronkan mem-push snapshot ke Supabase
        cloud backup. Kategori master/menu/promosi akan menyusul di fase berikutnya.
      </p>
    </div>
  );
}
