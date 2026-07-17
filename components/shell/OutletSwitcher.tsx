"use client";

import { useTransition } from "react";
import { ChevronDown, Store } from "lucide-react";
import type { OutletIdentity } from "@/lib/outlet-identity";
import { setShellOutletAction } from "@/app/shell-actions";

export function OutletSwitcher({
  outlets,
  activeSlug,
  activeLabel
}: {
  outlets: OutletIdentity[];
  activeSlug: string | null;
  activeLabel: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="relative">
      <label htmlFor="shell-outlet" className="sr-only">
        Pilih outlet
      </label>
      <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
        <Store className="h-4 w-4" aria-hidden />
      </div>
      <select
        id="shell-outlet"
        disabled={pending}
        value={activeSlug ?? "all"}
        onChange={(e) => {
          const value = e.target.value;
          startTransition(async () => {
            await setShellOutletAction(value);
            window.location.reload();
          });
        }}
        className="nf3-select h-9 min-w-[10rem] appearance-none rounded-lg border-slate-200 bg-white pl-8 pr-8 text-xs font-semibold text-slate-700"
      >
        <option value="all">Semua Outlet</option>
        {outlets.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.code} — {o.name}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
        aria-hidden
      />
      <span className="sr-only">Outlet aktif: {activeLabel}</span>
    </div>
  );
}
