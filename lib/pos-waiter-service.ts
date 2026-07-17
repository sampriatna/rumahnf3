import { listCashierPins } from "./db/auth-repo";
import { isPosOutlet } from "./pos-seed";

export type PosWaiterOption = {
  id: string;
  label: string;
};

const FALLBACK_WAITERS: Record<string, PosWaiterOption[]> = {
  kbu: [
    { id: "kbu-w1", label: "Pelayan 1" },
    { id: "kbu-w2", label: "Pelayan 2" }
  ],
  kisamen: [
    { id: "ksm-w1", label: "Pelayan 1" },
    { id: "ksm-w2", label: "Pelayan 2" }
  ]
};

/** Daftar pelayan untuk selector POS — PIN kasir aktif outlet, fallback seed. */
export async function listPosWaiters(outletId: string): Promise<PosWaiterOption[]> {
  if (!isPosOutlet(outletId)) return [];

  try {
    const pins = await listCashierPins(outletId);
    const fromPins = pins
      .filter((p) => p.active)
      .map((p) => ({ id: p.id, label: p.label }));
    if (fromPins.length > 0) return fromPins;
  } catch {
    /* fallback */
  }

  return FALLBACK_WAITERS[outletId] ?? [];
}

export function resolveWaiterLabel(
  waiters: PosWaiterOption[],
  waiterId?: string
): string | undefined {
  if (!waiterId) return undefined;
  return waiters.find((w) => w.id === waiterId)?.label;
}
