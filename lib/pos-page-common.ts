import { redirect } from "next/navigation";
import { OUTLETS } from "@/lib/mock-data";
import { isPosOutlet } from "@/lib/pos-seed";
import { getOpenShift, getRegisterForShift } from "@/lib/pos-service";
import { requirePosSession } from "@/lib/pos-auth";
import { hasFloorPlan } from "@/lib/pos-floor";
import { listOnlinePendingOrders } from "@/lib/pos-service";
import { buildPosDrawerContext } from "@/lib/pos-drawer-context";
import { readPosDeviceCookie } from "@/lib/pos-device-cookie";

export function resolvePosDrawerOutlet(
  searchParams: { outlet?: string },
  session: ReturnType<typeof requirePosSession>
) {
  const outletId =
    searchParams.outlet && (session.role === "owner" || session.role === "admin")
      ? searchParams.outlet
      : session.outletId ?? searchParams.outlet;

  if (!outletId || !isPosOutlet(outletId)) redirect("/pos");
  const outlet = OUTLETS.find((o) => o.id === outletId)!;
  const shift = getOpenShift(outletId);
  const register = shift ? getRegisterForShift(shift.id) : undefined;
  const onlinePending = shift ? listOnlinePendingOrders(shift.id).length : 0;

  const ctx = buildPosDrawerContext({
    session,
    outletId,
    outletName: outlet.name,
    shift,
    register,
    onlinePending,
    hasFloor: hasFloorPlan(outletId),
    deviceId: readPosDeviceCookie()
  });

  return { outletId, outlet, shift, register, ctx };
}
