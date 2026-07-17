"use client";

import { useState } from "react";
import { Plus, Pencil, Radio, Store } from "lucide-react";
import type { SalesChannel, SalesChannelKind } from "@/lib/channel-service";
import { Modal } from "@/components/ui/Modal";
import {
  saveChannelAction,
  toggleChannelAction,
  setDefaultChannelAction,
  bootstrapChannelsAction
} from "@/app/library/channel-actions";

const KIND_LABEL: Record<SalesChannelKind, string> = {
  dine_in: "Dine In",
  takeaway: "Takeaway",
  platform: "Platform Ojol",
  delivery_own: "Delivery Sendiri",
  wholesale: "Grosir",
  production: "Produksi Internal",
  other: "Lainnya"
};

export function ChannelLibraryClient({
  outletId,
  channels
}: {
  outletId: string;
  channels: SalesChannel[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editChannel, setEditChannel] = useState<SalesChannel | null>(null);

  const activeCount = channels.filter((c) => c.active).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5 text-navy-700" aria-hidden />
          <p className="text-sm text-slate-600">
            {activeCount} channel aktif — dipakai kasir & laporan penjualan
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapChannelsAction}>
            <input type="hidden" name="outletId" value={outletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset template
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setEditChannel(null);
              setModalOpen(true);
            }}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Channel
          </button>
        </div>
      </div>

      {channels.length === 0 ? (
        <div className="panel p-8 text-center">
          <Store className="mx-auto mb-3 h-10 w-10 text-slate-300" aria-hidden />
          <p className="font-bold text-navy-900">Belum ada channel penjualan</p>
        </div>
      ) : (
        <ul className="panel divide-y divide-slate-100">
          {channels.map((ch) => (
            <li key={ch.id} className={`px-4 py-4 ${!ch.active ? "opacity-50" : ""}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-navy-900">{ch.name}</p>
                    {ch.isDefault && (
                      <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold uppercase text-gold-800">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    ID <code className="rounded bg-slate-100 px-1">{ch.id}</code> · {KIND_LABEL[ch.kind]} · urutan{" "}
                    {ch.sortOrder}
                    {ch.requiresTable ? " · wajib meja" : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!ch.isDefault && ch.active && (
                    <form action={setDefaultChannelAction}>
                      <input type="hidden" name="outletId" value={outletId} />
                      <input type="hidden" name="id" value={ch.id} />
                      <button type="submit" className="btn-secondary px-2 py-1.5 text-xs" title="Jadikan default">
                        <Radio className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </form>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditChannel(ch);
                      setModalOpen(true);
                    }}
                    className="btn-secondary px-2 py-1.5 text-xs"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                  </button>
                  <form action={toggleChannelAction}>
                    <input type="hidden" name="outletId" value={outletId} />
                    <input type="hidden" name="id" value={ch.id} />
                    <input type="hidden" name="active" value={ch.active ? "0" : "1"} />
                    <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                      {ch.active ? "Off" : "On"}
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editChannel ? "Edit Channel" : "Tambah Channel"}>
        <form action={saveChannelAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editChannel && <input type="hidden" name="id" value={editChannel.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Nama tampilan
            <input
              name="name"
              required
              defaultValue={editChannel?.name ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          {!editChannel && (
            <label className="block text-sm font-bold text-slate-700">
              Slug ID (opsional)
              <input
                name="slug"
                placeholder="gofood, dine_in, …"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm"
              />
            </label>
          )}
          <label className="block text-sm font-bold text-slate-700">
            Jenis
            <select
              name="kind"
              defaultValue={editChannel?.kind ?? "takeaway"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {(Object.keys(KIND_LABEL) as SalesChannelKind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Urutan
            <input
              name="sortOrder"
              type="number"
              min={1}
              defaultValue={editChannel?.sortOrder ?? channels.length + 1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" name="requiresTable" defaultChecked={editChannel?.requiresTable ?? false} className="rounded" />
            Wajib isi meja
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" name="isDefault" defaultChecked={editChannel?.isDefault ?? false} className="rounded" />
            Channel default outlet
          </label>
          <button type="submit" className="btn-primary py-3">
            Simpan Channel
          </button>
        </form>
      </Modal>
    </>
  );
}
