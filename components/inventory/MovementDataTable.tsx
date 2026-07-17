import type { StockMovement } from "@/lib/inventory";
import { movementTypeLabel, movementTypeTone } from "@/lib/inventory-ui";
import { OpStatusBadge } from "@/components/ui/OpStatusBadge";

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function formatQty(n: number) {
  return n.toLocaleString("id-ID");
}

export function MovementDataTable({ movements }: { movements: StockMovement[] }) {
  if (movements.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
        Belum ada pergerakan stok.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th className="p-3">Waktu</th>
              <th className="p-3">Jenis</th>
              <th className="p-3">Bahan</th>
              <th className="p-3">Lokasi</th>
              <th className="p-3 text-right">Qty</th>
              <th className="p-3">Oleh</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m) => (
              <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                <td className="p-3 text-xs text-slate-500">{formatTime(m.createdAt)}</td>
                <td className="p-3">
                  <OpStatusBadge tone={movementTypeTone(m.movementType)}>
                    {movementTypeLabel(m.movementType)}
                  </OpStatusBadge>
                </td>
                <td className="p-3 font-semibold text-navy-900">{m.itemName}</td>
                <td className="p-3 text-slate-600">{m.locationLabel}</td>
                <td className="p-3 text-right font-bold text-navy-800">
                  {formatQty(m.qty)} {m.unit}
                </td>
                <td className="p-3 text-xs text-slate-500">{m.createdBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
        Menampilkan {movements.length} mutasi terbaru — stok dihitung dari log ini.
      </p>
    </div>
  );
}
