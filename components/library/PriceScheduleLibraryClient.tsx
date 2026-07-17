"use client";

import { useState } from "react";
import { Plus, Pencil, Clock } from "lucide-react";
import type { MenuPriceSchedule } from "@/lib/price-schedule-service";
import { DAY_LABELS, formatScheduleDays } from "@/lib/price-schedule-utils";
import { Modal } from "@/components/ui/Modal";
import {
  savePriceScheduleAction,
  togglePriceScheduleAction,
  bootstrapPriceSchedulesAction
} from "@/app/library/price-schedule-actions";

const TYPE_LABEL: Record<MenuPriceSchedule["adjustType"], string> = {
  fixed_price: "Harga tetap (Rp)",
  percent_off: "Diskon %"
};

export function PriceScheduleLibraryClient({
  outletId,
  schedules
}: {
  outletId: string;
  schedules: MenuPriceSchedule[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editSchedule, setEditSchedule] = useState<MenuPriceSchedule | null>(null);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          {schedules.filter((s) => s.active).length} jadwal aktif — harga POS berubah otomatis per jam/hari
        </p>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapPriceSchedulesAction}>
            <input type="hidden" name="outletId" value={outletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset template
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setEditSchedule(null);
              setModalOpen(true);
            }}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Jadwal
          </button>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="panel p-8 text-center">
          <Clock className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
          <p className="font-bold text-navy-900">Belum ada scheduler harga</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-slate-100">
          {schedules.map((sch) => (
            <li key={sch.id} className={`px-4 py-4 ${!sch.active ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-navy-900">{sch.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatScheduleDays(sch.daysOfWeek)} · {sch.startTime}–{sch.endTime} ·{" "}
                    {TYPE_LABEL[sch.adjustType]} {sch.value}
                  </p>
                  {(sch.targetCategoryIds.length > 0 || sch.targetMenuItemIds.length > 0) && (
                    <p className="mt-1 text-xs text-slate-400">
                      {sch.targetCategoryIds.length > 0 && `Kategori: ${sch.targetCategoryIds.join(", ")}`}
                      {sch.targetMenuItemIds.length > 0 && ` · Item: ${sch.targetMenuItemIds.join(", ")}`}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditSchedule(sch);
                      setModalOpen(true);
                    }}
                    className="btn-secondary px-2 py-1.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <form action={togglePriceScheduleAction}>
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="id" value={sch.id} />
                    <input type="hidden" name="active" value={sch.active ? "0" : "1"} />
                    <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                      {sch.active ? "Off" : "On"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editSchedule ? "Edit Scheduler Harga" : "Tambah Scheduler Harga"}
      >
        <form action={savePriceScheduleAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editSchedule && <input type="hidden" name="id" value={editSchedule.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Nama (mis. Happy Hour)
            <input
              name="name"
              required
              defaultValue={editSchedule?.name ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <fieldset>
            <legend className="text-sm font-bold text-slate-700">Hari aktif</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {DAY_LABELS.map((label, i) => (
                <label key={label} className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    name="daysOfWeek"
                    value={i}
                    defaultChecked={
                      editSchedule
                        ? editSchedule.daysOfWeek.includes(i)
                        : i >= 1 && i <= 5
                    }
                    className="rounded"
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-bold text-slate-700">
              Jam mulai
              <input
                name="startTime"
                type="time"
                required
                defaultValue={editSchedule?.startTime ?? "15:00"}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="block text-sm font-bold text-slate-700">
              Jam selesai
              <input
                name="endTime"
                type="time"
                required
                defaultValue={editSchedule?.endTime ?? "17:00"}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm font-bold text-slate-700">
            Tipe penyesuaian
            <select
              name="adjustType"
              defaultValue={editSchedule?.adjustType ?? "percent_off"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              <option value="percent_off">Diskon % dari harga normal</option>
              <option value="fixed_price">Harga tetap (Rp)</option>
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Nilai (% atau Rp)
            <input
              name="value"
              type="number"
              min={0}
              required
              defaultValue={editSchedule?.value ?? 15}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Kategori target (ID dipisah koma)
            <input
              name="targetCategoryIds"
              defaultValue={editSchedule?.targetCategoryIds?.join(", ") ?? ""}
              placeholder="cat-kbu-kopi, cat-kbu-minum"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Item target (ID dipisah koma, opsional)
            <input
              name="targetMenuItemIds"
              defaultValue={editSchedule?.targetMenuItemIds?.join(", ") ?? ""}
              placeholder="mi-latte, mi-cappuccino"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs"
            />
          </label>
          <button type="submit" className="btn-primary py-3">
            Simpan Jadwal
          </button>
        </form>
      </Modal>
    </>
  );
}
