export default function RootLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-5">
      <div className="panel w-full max-w-sm p-6 text-center">
        <div
          className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-[3px] border-slate-200 border-t-navy-800"
          aria-hidden
        />
        <p className="text-sm font-bold text-navy-900">Memuat Rumah NF3…</p>
        <p className="mt-1 text-xs text-slate-500">Mohon tunggu sebentar.</p>
      </div>
    </main>
  );
}
