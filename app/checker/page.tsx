import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { isPosOutlet, POS_OUTLET_IDS } from "@/lib/pos-seed";
import { UI_FLAGS } from "@/lib/ui-flags";
import { canAccessOutlet } from "@/lib/data-scope";
import { resolvePortalOutletScope } from "@/lib/portal-outlet-scope";
import { canAccessCapability } from "@/lib/staff-capability";
import { listCheckerBoard } from "@/lib/checker-service";
import { CheckerBoard } from "@/components/checker/CheckerBoard";

const VIEW_ROLES = ["owner", "admin", "leader", "staff"];

function canViewChecker(session: NonNullable<ReturnType<typeof getSession>>): boolean {
  if (!VIEW_ROLES.includes(session.role)) return false;
  if (session.role === "staff") {
    return canAccessCapability(session, "pos") || canAccessCapability(session, "kds");
  }
  return true;
}

export default function CheckerPage({
  searchParams
}: {
  searchParams: { outlet?: string };
}) {
  if (!UI_FLAGS.checkerReadV1) {
    redirect("/dashboard");
  }

  const session = getSession();
  if (!session) redirect("/login");
  if (!canViewChecker(session)) redirect("/dashboard");

  const outletId = resolvePortalOutletScope(session, searchParams.outlet);

  if (!outletId || !isPosOutlet(outletId)) {
    if (session.role === "owner" || session.role === "admin") {
      return (
        <main className="mx-auto max-w-lg px-5 py-12">
          <h1 className="text-2xl font-black text-navy-900">Checker — Pilih Outlet</h1>
          <p className="mt-2 text-slate-600">Pantau kesiapan pesanan per area dapur/bar.</p>
          <div className="mt-6 grid gap-3">
            {OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id)).map((o) => (
              <Link key={o.id} href={`/checker?outlet=${o.id}`} className="btn-primary py-4">
                {o.name}
              </Link>
            ))}
          </div>
        </main>
      );
    }
    redirect("/dashboard");
  }

  if (!canAccessOutlet(session, outletId)) redirect("/dashboard");

  const outlet = OUTLETS.find((o) => o.id === outletId)!;
  const orders = listCheckerBoard(outletId);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      <header className="mb-6">
        <h1 className="text-2xl font-black text-navy-900">Checker</h1>
        <p className="mt-1 text-sm text-slate-600">
          {outlet.name} · Kesiapan pesanan lintas dapur & bar (read-only)
        </p>
      </header>
      <CheckerBoard orders={orders} outletName={outlet.name} outletId={outletId} />
    </main>
  );
}
