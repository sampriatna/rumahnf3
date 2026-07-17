import { redirect } from "next/navigation";
import { Suspense } from "react";

import { APP_NAME } from "@/lib/constants";

import { getSession } from "@/lib/session";

import { getRoleConfig } from "@/lib/rbac";

import { groupMenuItems } from "@/lib/dashboard-groups";

import { OUTLETS } from "@/lib/mock-data";

import { RoleBadge } from "@/components/RoleBadge";

import { MenuCard } from "@/components/MenuCard";
import { OwnerDashboardShell } from "@/components/dashboard/OwnerDashboardShell";
import { CrossOriginRedirect } from "@/components/CrossOriginRedirect";
import { StaffShell } from "@/components/staff/StaffShell";
import { StaffPage } from "@/components/staff/StaffPage";
import { StaffWelcome } from "@/components/staff/StaffWelcome";
import { StaffMenuCard } from "@/components/staff/StaffMenuCard";

import { effectiveCapabilities } from "@/lib/staff-capability";

import { isPosOutlet } from "@/lib/pos-seed";

import { configuredKdsUrl, posAppUrl } from "@/lib/subdomains";
import { UI_FLAGS } from "@/lib/ui-flags";
import { OwnerSummarySection } from "./OwnerSummarySection";
import { OwnerSummaryFallback } from "./OwnerSummaryFallback";
import { workUnitForIdentity } from "@/lib/finance-access";
import type { MenuItem } from "@/lib/types";
import { toOutletSlug } from "@/lib/outlet-identity";

export default async function DashboardPage() {
  const session = getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "staff") {
    const caps = effectiveCapabilities(session);
    const outletSlug = toOutletSlug(session.outletId);

    if (caps.length === 1 && outletSlug && isPosOutlet(outletSlug)) {
      if (caps[0] === "pos") {
        return <CrossOriginRedirect url={posAppUrl(`/pos?outlet=${outletSlug}`)} />;
      }

      if (caps[0] === "kds") {
        const kdsBase = configuredKdsUrl();
        const q = `?outlet=${outletSlug}`;
        return <CrossOriginRedirect url={kdsBase ? `${kdsBase}${q}` : `/kds${q}`} />;
      }
    }
  }

  // Redirect antar subdomain (staff ↔ portal) ditangani middleware HTTP 308.

  const cfg = getRoleConfig(session.role);

  const isStaff = session.role === "staff";

  const sessionOutletSlug = toOutletSlug(session.outletId);
  const outlet = sessionOutletSlug ? OUTLETS.find((o) => o.id === sessionOutletSlug) : undefined;
  const areaUnit = workUnitForIdentity({
    name: session.name,
    email: session.email,
    phone: session.phone
  });

  const menuSections = session.role === "owner" ? groupMenuItems(cfg.menu) : null;
  const shellOn = UI_FLAGS.appShell;

  const staffMenu: MenuItem[] =
    isStaff && areaUnit === "Jagasatru"
      ? [
          ...cfg.menu.filter((item) => !["slip-gaji", "status-saya"].includes(item.id)),
          {
            id: "wallet-jagasatru",
            label: "Dompet Jagasatru",
            desc: "Input & pantau transaksi Jagasatru.",
            icon: "wallet",
            href: "/finance",
            phase: 6,
            ready: true
          },
          {
            id: "ledger-jagasatru",
            label: "Laporan Jagasatru",
            desc: "Filter transaksi, verifikasi, dan bukti.",
            icon: "bar-chart-3",
            href: "/finance/ledger?wallet=jagasatru_wallet",
            phase: 6,
            ready: true
          },
          {
            id: "purchasing-jagasatru",
            label: "Purchasing Jagasatru",
            desc: "Pantau PO dan status belanja Jagasatru.",
            icon: "receipt",
            href: "/purchasing",
            phase: 5,
            ready: true
          }
        ]
      : cfg.menu;

  const body = isStaff ? (
    <StaffPage>
      <StaffWelcome
        name={session.name}
        role={session.role}
        outletName={areaUnit ?? outlet?.name}
        email={session.email}
        phone={session.phone}
        tagline={cfg.tagline}
      />
      <section>
        <h2 className="staff-section-title mb-3">Menu Utama</h2>
        <div className="grid gap-3">
          {staffMenu.map((item) => (
            <StaffMenuCard key={item.id} item={item} />
          ))}
        </div>
      </section>
      <footer className="mt-10 text-center text-[11px] text-slate-400">
        Portal Staf NF3 · Form, SOP & slip gaji
      </footer>
    </StaffPage>
  ) : (
    <main className={shellOn ? "" : "mx-auto max-w-5xl px-5 py-8"}>
      {!shellOn && (
        <header className="mb-8 flex flex-col gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-black text-navy-900">Halo, {session.name}</h1>
              <RoleBadge role={session.role} isSuperAdmin={session.isSuperAdmin} />
              {outlet && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {outlet.name}
                </span>
              )}
              {areaUnit && (
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  {areaUnit}
                </span>
              )}
            </div>
            <p className="mt-1 text-slate-600">{cfg.tagline}</p>
          </div>
        </header>
      )}

      {shellOn && (
        <header className="mb-6">
          <h1 className="text-2xl font-black text-navy-900">Halo, {session.name}</h1>
          <p className="mt-1 text-sm text-slate-600">{cfg.tagline}</p>
        </header>
      )}

      {menuSections ? (
        <OwnerDashboardShell
          summary={
            <Suspense fallback={<OwnerSummaryFallback />}>
              <OwnerSummarySection />
            </Suspense>
          }
          menuSections={menuSections}
          hideMenuTab={shellOn}
        />
      ) : (
        <section>
          {!shellOn ? (
            <>
              <h2 className="dashboard-section-title">Ruang Kerja</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cfg.menu.map((item) => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Gunakan menu di sidebar untuk membuka modul kerja Anda.
            </p>
          )}
        </section>
      )}

      {!shellOn && (
        <footer className="mt-12 border-t border-slate-200 pt-5 text-center text-xs text-slate-400">
          {APP_NAME} · Ringkasan dari finance, forms, inventory & POS.
        </footer>
      )}
    </main>
  );

  if (isStaff) {
    return <StaffShell>{body}</StaffShell>;
  }

  return body;
}
