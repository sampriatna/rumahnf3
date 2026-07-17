import type { PosOrderChannel } from "./pos-kds-roadmap";
import { ensureChannelsReady, getDefaultSalesChannel } from "./channel-service";

export type PosOutletConfig = {
  /** Channel default saat buat order baru. */
  defaultChannel: PosOrderChannel;
  /** Outlet pakai open bill (satu order per meja, tambah item berulang). */
  openBillMode: boolean;
  /** Meja wajib diisi sebelum simpan ke bill. */
  requireTable: boolean;
};

const OUTLET_BEHAVIOR: Record<string, Pick<PosOutletConfig, "openBillMode" | "requireTable">> = {
  kbu: { openBillMode: true, requireTable: true },
  kisamen: { openBillMode: true, requireTable: true },
  samtaro: { openBillMode: false, requireTable: false }
};

export function getPosOutletConfig(outletId: string): PosOutletConfig {
  ensureChannelsReady(outletId);
  const behavior = OUTLET_BEHAVIOR[outletId] ?? { openBillMode: false, requireTable: false };
  const defaultCh = getDefaultSalesChannel(outletId);
  return {
    defaultChannel: defaultCh?.id ?? "dine_in",
    openBillMode: behavior.openBillMode,
    requireTable: behavior.requireTable
  };
}
