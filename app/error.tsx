"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Rumah NF3]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5">
      <div className="panel w-full max-w-md p-6 text-center">
        <h1 className="text-lg font-black text-navy-900">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-slate-600">
          Aplikasi tidak bisa menampilkan halaman ini. Coba muat ulang — jika masalah
          berlanjut, hubungi admin IT.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-[10px] text-slate-400">Ref: {error.digest}</p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => reset()} className="btn-primary px-4 py-2 text-sm">
            Coba lagi
          </button>
          <Link href="/dashboard" className="btn-secondary px-4 py-2 text-sm">
            Ke Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
