import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame, ChefHat, Package } from "lucide-react";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { isPosOutlet, POS_OUTLET_IDS } from "@/lib/pos-seed";
import { getStations, listBoard } from "@/lib/kds-board-service";
import { KdsAutoRefresh } from "@/components/KdsAutoRefresh";
import { KdsTabletShell } from "@/components/kds/KdsTabletShell";
import { getKdsClosingContext } from "@/lib/kds-closing-service";
import { canAccessCapability, kdsAccessDeniedRedirect } from "@/lib/staff-capability";
import { getMenuForOutlet } from "@/lib/pos-service";
import { UI_FLAGS } from "@/lib/ui-flags";
import type { KdsStationId } from "@/types/kds";

const KDS_ROLES = ["staff", "leader", "admin", "owner"];

const STATION_ICON: Record<string, typeof Flame> = {
  dapur: ChefHat,
  bar: Flame,
  packing: Package
};

export default async function KdsPage({
  searchParams
}: {
  searchParams: {
    outlet?: string;
    station?: string;
    menu?: string;
    item?: string;
    error?: string;
    closing?: string;
    msg?: string;
    note?: string;
  };
}) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!KDS_ROLES.includes(session.role)) redirect("/dashboard");
  if (!canAccessCapability(session, "kds")) redirect(kdsAccessDeniedRedirect());

  const outletId =
    searchParams.outlet && (session.role === "owner" || session.role === "admin")
      ? searchParams.outlet
      : session.outletId ?? searchParams.outlet;

  if (!outletId || !isPosOutlet(outletId)) {
    if (session.role === "owner" || session.role === "admin") {
      return (
        <main className="mx-auto max-w-lg px-5 py-12">
          <h1 className="text-2xl font-black text-navy-900">KDS — Pilih Outlet</h1>
          <div className="mt-6 grid gap-3">
            {OUTLETS.filter((o) => POS_OUTLET_IDS.has(o.id)).map((o) => (
              <Link key={o.id} href={`/kds?outlet=${o.id}`} className="btn-primary py-4">
                {o.name}
              </Link>
            ))}
          </div>
        </main>
      );
    }
    redirect("/dashboard");
  }

  const stations = getStations(outletId);
  const stationId = (searchParams.station ?? stations[0]?.id) as KdsStationId;

  if (!stationId || !stations.some((s) => s.id === stationId)) {
    return (
      <main className="min-h-screen bg-navy-950 px-4 py-8 text-white">
        <Link href="/dashboard" className="text-sm font-bold text-gold-400">
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-3xl font-black">KDS — Pilih Station</h1>
        <p className="text-slate-400">{OUTLETS.find((o) => o.id === outletId)?.name}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stations.map((st) => {
            const Icon = STATION_ICON[st.id] ?? Flame;
            return (
              <Link
                key={st.id}
                href={`/kds?outlet=${outletId}&station=${st.id}`}
                className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border-2 border-navy-700 bg-navy-900 p-8 text-center transition hover:border-gold-400"
              >
                <Icon className="mb-3 h-10 w-10 text-gold-400" aria-hidden />
                <span className="text-2xl font-black">{st.name}</span>
              </Link>
            );
          })}
        </div>
      </main>
    );
  }

  const stationName = stations.find((s) => s.id === stationId)?.name ?? stationId;
  const outlet = OUTLETS.find((o) => o.id === outletId)!;
  const board = listBoard(outletId, stationId);
  const { items: menuItems } = getMenuForOutlet(outletId);
  const closingCtx = await getKdsClosingContext(outletId, stationId);

  let closingMsg: string | undefined;
  let closingError: string | undefined;
  if (searchParams.closing === "ok" && searchParams.item) {
    closingMsg = `Opname ${searchParams.item} tersimpan${searchParams.note ? ` — ${searchParams.note}` : ""}`;
  } else if (searchParams.closing === "waste" && searchParams.item) {
    closingMsg = `Waste ${searchParams.item} tercatat`;
  } else if (searchParams.closing === "error") {
    closingError = searchParams.msg ?? "Gagal menyimpan";
  }

  const columns = [
    { key: "baru" as const, label: "Baru", tickets: board.baru },
    { key: "diproces" as const, label: "Diproses", tickets: board.diproces },
    { key: "siap" as const, label: "Siap", tickets: board.siap }
  ];

  const pendingOpname = closingCtx.checklist.filter((c) => !c.sudahOpnameHariIni).length;
  const stationMenu = menuItems.filter((i) => i.defaultAreaId === stationId);
  const soldOutCount = (stationMenu.length > 0 ? stationMenu : menuItems).filter(
    (i) => i.soldOut
  ).length;

  const initialTab = searchParams.closing
    ? "closing"
    : searchParams.menu === "soldout"
      ? "menu"
      : "orders";

  const soldOutBanner =
    searchParams.menu === "soldout" && searchParams.item
      ? `${searchParams.item} ditandai habis — sync ke POS.`
      : undefined;

  return (
    <>
      <KdsAutoRefresh seconds={12} />
      <KdsTabletShell
        outletId={outletId}
        outletName={outlet.name}
        stationId={stationId}
        stationName={stationName}
        stations={stations.map((s) => ({ id: s.id, name: s.name }))}
        servedToday={board.servedToday}
        columns={columns}
        menuItems={menuItems}
        closingToday={closingCtx.today}
        checklist={closingCtx.checklist}
        optionalChecklist={closingCtx.optionalChecklist}
        wasteOptions={closingCtx.wasteOptions}
        lokasi={closingCtx.lokasi}
        closingMsg={closingMsg}
        closingError={closingError}
        soldOutBanner={soldOutBanner}
        initialTab={initialTab}
        pendingOpname={pendingOpname}
        soldOutCount={soldOutCount}
        showSummary={UI_FLAGS.kdsSummaryV1}
      />
    </>
  );
}
