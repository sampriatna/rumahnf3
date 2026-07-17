"use client";

import { useState } from "react";
import { User, Flame, Shield } from "lucide-react";
import { addStaffAccountAction } from "@/app/settings/accounts/actions";
import { portalAppUrl } from "@/lib/subdomains";

type Preset = "personal" | "kds" | "leader" | "purchasing";

const PRESETS: {
  id: Preset;
  label: string;
  desc: string;
  icon: typeof User;
}[] = [
  {
    id: "personal",
    label: "Staf Biasa",
    desc: "HP pribadi — gaji, SOP, form",
    icon: User
  },
  {
    id: "kds",
    label: "Tablet Dapur/Bar",
    desc: "Layar pesanan KDS saja",
    icon: Flame
  },
  {
    id: "leader",
    label: "Leader Outlet",
    desc: "Approve & pantau tim",
    icon: Shield
  },
  {
    id: "purchasing",
    label: "Purchasing",
    desc: "Input belanja & bukti transaksi",
    icon: User
  }
];

export function StaffAccountForm({
  outlets,
  disabled
}: {
  outlets: { id: string; name: string }[];
  disabled?: boolean;
}) {
  const [preset, setPreset] = useState<Preset>("personal");

  return (
    <form action={addStaffAccountAction} className="grid gap-4">
      <input type="hidden" name="accountType" value={preset} />

      <div>
        <p className="mb-2 text-sm font-bold text-navy-900">Jenis akun</p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {PRESETS.map((p) => {
            const Icon = p.icon;
            const on = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setPreset(p.id)}
                className={`rounded-xl border-2 p-4 text-left transition ${
                  on ? "border-gold-400 bg-gold-50" : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <Icon className={`mb-2 h-6 w-6 ${on ? "text-gold-600" : "text-slate-400"}`} aria-hidden />
                <p className="font-bold text-navy-900">{p.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-slate-700">Nama</label>
        <input
          name="fullName"
          required
          placeholder="Nama staf"
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-gold-400"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="text-sm font-bold text-slate-700">Nomor HP</label>
          <input
            name="phone"
            inputMode="numeric"
            required
            placeholder="08xxxxxxxxxx"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-gold-400"
          />
          <p className="mt-1 text-xs text-slate-400">Dipakai login di halaman masuk</p>
        </div>
        <div>
          <label className="text-sm font-bold text-slate-700">PIN (4–8 angka)</label>
          <input
            name="pin"
            type="password"
            inputMode="numeric"
            required
            minLength={4}
            maxLength={8}
            pattern="[0-9]{4,8}"
            placeholder="••••"
            className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-center text-xl tracking-widest outline-none focus:border-gold-400"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-bold text-slate-700">Outlet</label>
        <select
          name="outletId"
          required
          className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-base outline-none focus:border-gold-400"
        >
          <option value="">Pilih outlet…</option>
          {outlets.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-primary py-4 text-base" disabled={disabled}>
        Simpan Akun
      </button>
    </form>
  );
}
