import Link from "next/link";
import { Construction } from "lucide-react";
import { APP_NAME } from "@/lib/constants";

// Placeholder untuk fitur yang belum diimplementasi penuh.
// searchParams: Promise.resolve() agar kompatibel Next 14 (sync) & 15 (async).
export default async function SegeraPage({
  searchParams
}: {
  searchParams: { fitur?: string } | Promise<{ fitur?: string }>;
}) {
  const params = await Promise.resolve(searchParams);
  const fitur = params.fitur ?? "Fitur ini";

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center bg-surface px-5 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gold-100 text-gold-600">
        <Construction className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="text-2xl font-black text-navy-900">{fitur}</h1>
      <p className="mt-2 text-slate-600">
        Modul ini belum tersedia di {APP_NAME}. ERP Lite inti (POS, Inventory, Loyalty, Finance)
        sudah jalan — ruang ini akan diisi di fase berikutnya.
      </p>
      <Link href="/dashboard" className="btn-secondary mt-6">
        Kembali ke Dashboard
      </Link>
    </main>
  );
}
