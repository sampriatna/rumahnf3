import { getSalesChannel, ensureChannelsReady } from "./channel-service";
import { getPosOutletConfig } from "./pos-outlet-config";
import { isPosOutlet } from "./pos-seed";

export type PosOrderValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validatePosOrderContext(input: {
  outletId: string;
  channel: string;
  tableLabel?: string;
}): PosOrderValidationResult {
  if (!isPosOutlet(input.outletId)) {
    return { ok: false, error: "Outlet tidak valid." };
  }

  ensureChannelsReady(input.outletId);
  const cfg = getPosOutletConfig(input.outletId);
  const channelMeta = getSalesChannel(input.outletId, input.channel);
  const tableRequired = channelMeta?.requiresTable ?? cfg.requireTable;

  if (tableRequired && !input.tableLabel?.trim()) {
    return { ok: false, error: "Meja wajib untuk tipe pesanan ini." };
  }

  return { ok: true };
}
