export default function PosLoading() {
  return (
    <main className="pos-shell flex min-h-screen items-center justify-center bg-surface px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-navy-800" />
        <p className="text-sm font-bold text-navy-900">Memuat kasir…</p>
        <p className="mt-1 text-xs text-slate-500">Menu outlet & shift kasir</p>
      </div>
    </main>
  );
}
