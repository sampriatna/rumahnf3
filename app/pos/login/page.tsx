import { redirect } from "next/navigation";
import { Banknote } from "lucide-react";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { posAppUrl, portalAppUrl } from "@/lib/subdomains";
import { PosLoginForm } from "@/components/pos/PosLoginForm";
import { posLandingPath, canAccessPos } from "@/lib/pos-auth";
import { isPosOutlet } from "@/lib/pos-seed";

export default function PosLoginPage({
  searchParams
}: {
  searchParams: { error?: string; next?: string };
}) {
  const session = getSession();
  const next =
    searchParams.next?.startsWith("/pos") && !searchParams.next.startsWith("//")
      ? searchParams.next
      : undefined;

  if (session && canAccessPos(session)) {
    redirect(posLandingPath(session, next));
  }

  const posOutlets = OUTLETS.filter((o) => isPosOutlet(o.id)).map((o) => ({
    id: o.id,
    name: o.name
  }));

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-12">
      <header className="mb-8 text-center">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-800 text-gold-400">
          <Banknote className="h-8 w-8" aria-hidden />
        </span>
        <h1 className="text-2xl font-black text-navy-900">POS Kasir</h1>
        <p className="mt-1 text-sm text-slate-600">Pilih outlet → masukkan PIN kasir</p>
      </header>

      <PosLoginForm
        outlets={posOutlets}
        hasError={Boolean(searchParams.error)}
        errorCode={searchParams.error}
        isDev={process.env.NODE_ENV !== "production"}
        nextPath={next}
      />
    </main>
  );
}
