import { redirect } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, ClipboardList, RotateCcw, Truck } from "lucide-react";
import { getSession } from "@/lib/session";
import { listMovements } from "@/lib/inventory-service";
import { InventoryPageHeader } from "@/components/inventory/InventoryPageHeader";
import { UI_FLAGS } from "@/lib/ui-flags";
import { MovementDataTable } from "@/components/inventory/MovementDataTable";

const VIEW_ROLES = ["leader", "owner", "admin"];

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("id-ID", { dateStyle: "short", timeStyle: "short" });
}

function movementIcon(type: string) {
  const t = type.toLowerCase();
  if (t.includes("masuk") || t.includes("in")) return ArrowDownLeft;
  if (t.includes("transfer")) return Truck;
  if (t.includes("waste") || t.includes("keluar")) return ArrowUpRight;
  if (t.includes("opname")) return ClipboardList;
  return RotateCcw;
}

function movementTone(type: string) {
  const t = type.toLowerCase();
  if (t.includes("masuk") || t.includes("in")) return "bg-emerald-100 text-emerald-700";
  if (t.includes("transfer")) return "bg-violet-100 text-violet-700";
  if (t.includes("waste")) return "bg-rose-100 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

export default function MovementsPage() {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const movements = listMovements(40);
  const invUi = UI_FLAGS.inventoryUiV1;

  return (
    <div className={invUi ? "max-w-5xl" : "max-w-3xl"}>
      <InventoryPageHeader
        title="Riwayat Pergerakan"
        subtitle={
          invUi
            ? "Tabel mutasi stok — qty dihitung dari log pergerakan, bukan edit manual."
            : "Timeline aktivitas stok — masuk, keluar, waste, transfer, opname."
        }
      />

      {invUi ? (
        <MovementDataTable movements={movements} />
      ) : movements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          Belum ada pergerakan stok.
        </div>
      ) : (
        <div className="relative space-y-0">
          <div className="absolute bottom-2 left-[19px] top-2 w-px bg-slate-200" aria-hidden />
          {movements.map((m) => {
            const Icon = movementIcon(m.movementType);
            const tone = movementTone(m.movementType);
            return (
              <div key={m.id} className="relative flex gap-4 pb-4">
                <span
                  className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-navy-900">
                        {m.movementType}
                        <span className="font-normal text-slate-400"> · </span>
                        {m.itemName}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        <span className="font-semibold text-slate-600">{m.locationLabel}</span>
                        <span className="mx-1.5 text-slate-300">|</span>
                        {m.qty} {m.unit}
                        <span className="mx-1.5 text-slate-300">|</span>
                        {m.createdBy}
                      </p>
                    </div>
                    <time className="shrink-0 text-[10px] font-medium text-slate-400">
                      {formatTime(m.createdAt)}
                    </time>
                  </div>
                  {m.note && (
                    <p className="mt-2 rounded-lg bg-[#FBF8F0] px-2.5 py-1.5 text-xs text-slate-600">
                      {m.note}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
