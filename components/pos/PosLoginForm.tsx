"use client";

import { useState } from "react";
import { portalAppUrl } from "@/lib/subdomains";
import { PasswordInput } from "@/components/ui/PasswordInput";

type OutletOption = { id: string; name: string };

type Props = {
  outlets: OutletOption[];
  hasError: boolean;
  errorCode?: string;
  isDev: boolean;
  nextPath?: string;
};

const ERROR_MSG: Record<string, string> = {
  invalid: "PIN salah untuk outlet ini.",
  forbidden: "Outlet tidak diizinkan.",
  "no-pos": "PIN tidak valid.",
  "missing-outlet": "Pilih outlet dulu."
};

export function PosLoginForm({ outlets, hasError, errorCode, isDev, nextPath }: Props) {
  const [outletId, setOutletId] = useState(outlets[0]?.id ?? "");
  const message = hasError ? ERROR_MSG[errorCode ?? "invalid"] ?? ERROR_MSG.invalid : null;

  return (
    <>
      <form action="/api/auth/login-pos" method="POST" className="panel flex flex-col gap-4 p-6">
        {nextPath ? <input type="hidden" name="next" value={nextPath} /> : null}
        <input type="hidden" name="outletId" value={outletId} />

        <div>
          <p className="mb-3 text-sm font-bold text-slate-700">Pilih Outlet</p>
          <div className="grid gap-2">
            {outlets.map((o) => {
              const selected = outletId === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setOutletId(o.id)}
                  className={`rounded-xl border-2 px-4 py-4 text-left font-bold transition ${
                    selected
                      ? "border-gold-400 bg-gold-50 text-navy-900"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {o.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label htmlFor="pin" className="text-sm font-bold text-slate-700">
            PIN Kasir
          </label>
          <div className="mt-1">
            <PasswordInput
              id="pin"
              name="pin"
              inputMode="numeric"
              autoComplete="off"
              placeholder="••••"
              centerText
            />
          </div>
        </div>

        {message && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">{message}</p>
        )}

        <button type="submit" className="btn-primary mt-1 py-4 text-base" disabled={!outletId}>
          Buka Kasir
        </button>
      </form>

      {isDev && (
        <div className="panel mt-5 p-4 text-xs text-slate-500">
          <p className="font-bold text-slate-600">Demo POS (dev)</p>
          <p className="mt-1">Pilih outlet → PIN <span className="font-mono text-slate-700">1234</span></p>
          <p className="mt-2 text-[10px]">
            POS terpisah dari Command Center — bookmark halaman ini di tablet kasir.
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-xs text-slate-500">
        Akun pribadi staf (gaji, SOP, form)?{" "}
        <a href={portalAppUrl("/login")} className="font-bold text-navy-700 underline">
          Login Command Center
        </a>
      </p>
    </>
  );
}
