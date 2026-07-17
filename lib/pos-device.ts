import { getRegisters } from "./pos-service";
import { readPosDeviceCookie } from "./pos-device-cookie";

function safeReadDeviceCookie(): string | undefined {
  try {
    return readPosDeviceCookie();
  } catch {
    return undefined;
  }
}

function labelFromDeviceId(deviceId: string): string {
  const short = deviceId.replace(/-/g, "").slice(-4).toUpperCase();
  return short ? `Device ${short}` : "Device 01";
}

/** Label perangkat kasir — Fase C: ID persisten per tablet via cookie. */
export function getPosDeviceLabel(
  registerId?: string | null,
  outletId?: string,
  deviceId?: string
): string {
  const id = deviceId ?? safeReadDeviceCookie();
  if (id) return labelFromDeviceId(id);

  if (registerId) {
    const registers = outletId ? getRegisters(outletId) : [];
    const reg = registers.find((r) => r.id === registerId);
    if (reg?.name) return reg.name;
    const suffix = registerId.replace(/^reg-?/i, "").slice(-2).toUpperCase();
    return suffix ? `Device ${suffix}` : "Device 01";
  }
  return "Device 01";
}
