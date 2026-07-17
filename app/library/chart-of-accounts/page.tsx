import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ensureCoaReady, listChartOfAccounts } from "@/lib/coa-service";
import { PageHeader } from "@/components/PageHeader";
import { CoaLibraryClient } from "@/components/library/CoaLibraryClient";

const LIBRARY_ROLES = ["leader", "admin", "owner"];

export default function LibraryChartOfAccountsPage({
  searchParams
}: {
  searchParams: { ok?: string; error?: string };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!LIBRARY_ROLES.includes(session.role)) redirect("/dashboard");

  ensureCoaReady();
  const accounts = listChartOfAccounts(true);

  const messages: Record<string, string> = {
    saved: "Akun disimpan.",
    on: "Akun diaktifkan.",
    off: "Akun dinonaktifkan.",
    bootstrapped: "Bagan akun diisi dari template default.",
    duplicate: "Kode akun sudah dipakai.",
    invalid: "Data tidak valid — cek lagi.",
    "not-found": "Data tidak ditemukan."
  };

  return (
    <main>
      <PageHeader
        title="Bagan Akun (COA)"
        subtitle="Master akuntansi — metode bayar POS dipetakan ke akun ini."
        backHref="/dashboard"
      />

      {searchParams.ok && (
        <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {messages[searchParams.ok] ?? "Berhasil."}
        </p>
      )}
      {searchParams.error && (
        <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
          {messages[searchParams.error] ?? "Terjadi kesalahan."}
        </p>
      )}

      <p className="mb-4 text-sm text-slate-600">
        Atur COA di sini, lalu petakan di{" "}
        <Link href="/library/payment-methods" className="font-bold text-navy-700 underline">
          Metode Bayar
        </Link>
        .
      </p>

      <CoaLibraryClient accounts={accounts} />
    </main>
  );
}
