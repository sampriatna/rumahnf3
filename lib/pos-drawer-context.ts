import type { SessionPayload } from "./session";
import type { PosShift, PosRegister } from "./pos-kds-roadmap";
import { isPosOnlyStaff } from "./pos-auth";
import { getPosDeviceLabel } from "./pos-device";
import { getPendingSyncCount } from "./pos-sync-status";

export type PosDrawerContext = {
  outletId: string;
  outletName: string;
  userName: string;
  userRole: SessionPayload["role"];
  shift: PosShift | null;
  register: PosRegister | null | undefined;
  deviceLabel: string;
  pendingSync: number;
  onlinePending: number;
  hasFloor: boolean;
  posOnlyStaff: boolean;
};

export function buildPosDrawerContext(input: {
  session: SessionPayload;
  outletId: string;
  outletName: string;
  shift?: PosShift | null;
  register?: PosRegister | null;
  onlinePending?: number;
  hasFloor?: boolean;
  deviceId?: string;
}): PosDrawerContext {
  const shift = input.shift ?? null;
  return {
    outletId: input.outletId,
    outletName: input.outletName,
    userName: input.session.name,
    userRole: input.session.role,
    shift,
    register: input.register,
    deviceLabel: getPosDeviceLabel(
      input.register?.id ?? shift?.registerId,
      input.outletId,
      input.deviceId
    ),
    pendingSync: getPendingSyncCount(input.outletId),
    onlinePending: input.onlinePending ?? 0,
    hasFloor: input.hasFloor ?? false,
    posOnlyStaff: isPosOnlyStaff(input.session)
  };
}
