"use client";

import { useEffect } from "react";

/** Paksa full-page navigation ke subdomain lain (hindari RSC soft-nav loop). */
export function CrossOriginRedirect({ url }: { url: string }) {
  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface px-5">
      <div className="panel w-full max-w-sm p-6 text-center">
        <div
          className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-navy-800"
          aria-hidden
        />
        <p className="text-sm font-bold text-navy-900">Mengalihkan…</p>
        <p className="mt-1 text-xs text-slate-500">Sebentar ya.</p>
      </div>
    </main>
  );
}
