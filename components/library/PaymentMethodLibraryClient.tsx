"use client";

import { useState } from "react";
import { Plus, Pencil, CreditCard } from "lucide-react";
import type { ChartOfAccount } from "@/lib/coa-service";
import type {
  PosPaymentMethodMaster,
  PaymentMethodKind,
  PaymentShiftBucket
} from "@/lib/payment-method-service";
import { Modal } from "@/components/ui/Modal";
import {
  savePaymentMethodAction,
  togglePaymentMethodAction,
  bootstrapPaymentMethodsAction
} from "@/app/library/payment-method-actions";

const KIND_LABEL: Record<PaymentMethodKind, string> = {
  cash: "Tunai",
  card: "Kartu",
  ewallet: "E-Wallet",
  platform: "Platform Ojol",
  transfer: "Transfer",
  other: "Lainnya"
};

const BUCKET_LABEL: Record<PaymentShiftBucket, string> = {
  cash: "Kas fisik",
  qris: "QRIS",
  online: "Online/Ojol",
  bank: "Bank/Kartu"
};

export function PaymentMethodLibraryClient({
  outletId,
  methods,
  coaAccounts
}: {
  outletId: string;
  methods: PosPaymentMethodMaster[];
  coaAccounts: ChartOfAccount[];
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<PosPaymentMethodMaster | null>(null);

  const coaLabel = (id: string) => coaAccounts.find((a) => a.id === id)?.name ?? id;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-navy-700" aria-hidden />
          <p className="text-sm text-slate-600">
            {methods.filter((m) => m.active).length} metode aktif di checkout POS
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={bootstrapPaymentMethodsAction}>
            <input type="hidden" name="outletId" value={outletId} />
            <button type="submit" className="btn-secondary px-3 py-2 text-xs">
              Reset template
            </button>
          </form>
          <button
            type="button"
            onClick={() => {
              setEditMethod(null);
              setModalOpen(true);
            }}
            className="btn-primary px-3 py-2 text-sm"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Metode
          </button>
        </div>
      </div>

      <ul className="panel divide-y divide-slate-100">
        {methods.map((m) => (
          <li key={m.id} className={`px-4 py-4 ${!m.active ? "opacity-50" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black text-navy-900">{m.name}</p>
                <p className="text-xs text-slate-500">
                  {KIND_LABEL[m.kind]} · COA: {coaLabel(m.coaAccountId)} · Setoran:{" "}
                  {BUCKET_LABEL[m.shiftBucket]}
                  {m.heldCashEnabled ? ` · Pending ${m.heldCashReleaseDays ?? 1} hari` : ""}
                </p>
                <p className="text-[10px] text-slate-400">Slug: {m.id}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditMethod(m);
                    setModalOpen(true);
                  }}
                  className="btn-secondary px-2 py-1.5 text-xs"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden />
                </button>
                <form action={togglePaymentMethodAction}>
                  <input type="hidden" name="outletId" value={outletId} />
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="active" value={m.active ? "0" : "1"} />
                  <button type="submit" className="btn-secondary px-2 py-1.5 text-xs">
                    {m.active ? "Off" : "On"}
                  </button>
                </form>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMethod ? "Edit Metode Bayar" : "Tambah Metode Bayar"}
      >
        <form action={savePaymentMethodAction} className="grid gap-4">
          <input type="hidden" name="outletId" value={outletId} />
          {editMethod && <input type="hidden" name="id" value={editMethod.id} />}
          <label className="block text-sm font-bold text-slate-700">
            Nama tampilan
            <input
              name="name"
              required
              defaultValue={editMethod?.name ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Jenis
            <select
              name="kind"
              defaultValue={editMethod?.kind ?? "other"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {Object.entries(KIND_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Akun COA
            <select
              name="coaAccountId"
              required
              defaultValue={editMethod?.coaAccountId ?? coaAccounts[0]?.id ?? ""}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {coaAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.code} · {a.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Bucket setoran shift
            <select
              name="shiftBucket"
              defaultValue={editMethod?.shiftBucket ?? "cash"}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            >
              {Object.entries(BUCKET_LABEL).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="hidden" name="heldCashEnabled" value="0" />
            <input
              type="checkbox"
              name="heldCashEnabled"
              value="1"
              defaultChecked={editMethod?.heldCashEnabled ?? false}
              className="rounded"
            />
            Kas tertahan (belum cair)
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Label kas tertahan
            <input
              name="heldCashSource"
              defaultValue={editMethod?.heldCashSource ?? ""}
              placeholder="QRIS / GoFood"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-bold text-slate-700">
            Hari cair (estimasi)
            <input
              name="heldCashReleaseDays"
              type="number"
              min={0}
              defaultValue={editMethod?.heldCashReleaseDays ?? 1}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <button type="submit" className="btn-primary w-full py-3">
            Simpan
          </button>
        </form>
      </Modal>
    </>
  );
}
