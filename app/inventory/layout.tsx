import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { OUTLETS } from "@/lib/mock-data";
import { InventorySidebar } from "@/components/inventory/InventorySidebar";
import { UI_FLAGS } from "@/lib/ui-flags";

const VIEW_ROLES = ["leader", "owner", "admin"];

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  const session = getSession();
  if (!session) redirect("/login");
  if (!VIEW_ROLES.includes(session.role)) redirect("/dashboard");

  const canManageData = session.role === "owner" || session.role === "admin";
  const outlet =
    session.role === "leader" && session.outletId
      ? OUTLETS.find((o) => o.id === session.outletId)
      : undefined;
  const outletLabel = outlet ? `${outlet.code} — ${outlet.name}` : undefined;
  const shellOn = UI_FLAGS.appShell;
  const invUi = UI_FLAGS.inventoryUiV1;

  return (
    <div className={shellOn ? "" : "min-h-screen bg-gradient-to-b from-[#FBF8F0]/80 via-surface to-white"}>
      <div
        className={`mx-auto flex gap-0 lg:gap-8 ${
          shellOn ? "max-w-none px-0 py-0" : "max-w-7xl px-4 py-6 lg:px-6"
        }`}
      >
        <InventorySidebar canManageData={canManageData} outletLabel={outletLabel} />
        <div
          className={`min-w-0 flex-1 pb-10 ${invUi && shellOn ? "px-1 sm:px-0" : ""}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
