import Link from "next/link";
import { redirect } from "next/navigation";
import { QrCode } from "lucide-react";
import { getShortcut } from "@/lib/qr";

// QR shortcut: scan -> langsung buka form/SOP yang sudah ter-prefill.
export default function QrRedirectPage({ params }: { params: { code: string } }) {
  const shortcut = getShortcut(params.code);
  if (shortcut) {
    redirect(shortcut.target);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-5 text-center">
      <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <QrCode className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="text-xl font-black text-navy-900">QR tidak dikenali</h1>
      <p className="mt-2 text-slate-600">
        Kode <span className="font-mono">{params.code}</span> belum terdaftar. Hubungi leader/admin.
      </p>
      <Link href="/dashboard" className="btn-secondary mt-6">
        Ke Dashboard
      </Link>
    </main>
  );
}
