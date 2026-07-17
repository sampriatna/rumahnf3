import type { PosOrder, PosSyncAction, PosSyncEntity, PosSyncQueueItem } from "./pos-kds-roadmap";
import { cloudSave, cloudSavePos } from "./cloud-persist";
import { readPosDeviceCookie } from "./pos-device-cookie";
import { UI_FLAGS } from "./ui-flags";
import { nextId, persistStore, store } from "./store";

function serializeStore(s: ReturnType<typeof store>) {
  return { ...s, sopReads: Array.from(s.sopReads) };
}

export function isPosSyncEnabled(): boolean {
  return UI_FLAGS.posSyncV1;
}

function resolveDeviceId(): string | undefined {
  try {
    return readPosDeviceCookie();
  } catch {
    return undefined;
  }
}

export function listPendingSyncItems(outletId?: string): PosSyncQueueItem[] {
  if (!isPosSyncEnabled()) return [];
  const queue = store().posSyncQueue ?? [];
  return queue.filter((item) => {
    if (item.syncedAt || item.failedAt) return false;
    if (outletId && item.outletId !== outletId) return false;
    return true;
  });
}

export function getPendingSyncCount(outletId?: string): number {
  return listPendingSyncItems(outletId).length;
}

export function getSyncCategorySummary(outletId: string) {
  const pending = listPendingSyncItems(outletId);
  return {
    penjualan: pending.filter((p) => p.entity === "order").length,
    shift: pending.filter((p) => p.entity === "shift").length,
    total: pending.length,
    items: pending
  };
}

export function enqueuePosSync(input: {
  outletId: string;
  entity: PosSyncEntity;
  entityId: string;
  action: PosSyncAction;
}): PosSyncQueueItem | null {
  if (!isPosSyncEnabled()) return null;

  const s = store();
  if (!s.posSyncQueue) s.posSyncQueue = [];

  const existing = s.posSyncQueue.find(
    (q) =>
      !q.syncedAt &&
      !q.failedAt &&
      q.entity === input.entity &&
      q.entityId === input.entityId &&
      q.outletId === input.outletId
  );

  if (existing) {
    if (input.action === "complete" && existing.action !== "complete") {
      existing.action = "complete";
      persistStore();
    }
    return existing;
  }

  const item: PosSyncQueueItem = {
    id: nextId("SYN"),
    outletId: input.outletId,
    entity: input.entity,
    entityId: input.entityId,
    action: input.action,
    createdAt: new Date().toISOString()
  };
  s.posSyncQueue.unshift(item);
  persistStore();
  return item;
}

export function touchOrderSync(
  order: PosOrder,
  action: PosSyncAction = "create",
  deviceId?: string
): void {
  if (!isPosSyncEnabled()) return;

  const resolvedDevice = deviceId ?? resolveDeviceId();
  order.syncStatus = "pending";
  if (resolvedDevice) order.deviceId = resolvedDevice;

  const syncAction: PosSyncAction =
    order.status === "completed" ? "complete" : action;

  enqueuePosSync({
    outletId: order.outletId,
    entity: "order",
    entityId: order.id,
    action: syncAction
  });
}

export function touchShiftSync(shiftId: string, outletId: string): void {
  if (!isPosSyncEnabled()) return;
  enqueuePosSync({
    outletId,
    entity: "shift",
    entityId: shiftId,
    action: "complete"
  });
}

export async function processPosSyncQueue(outletId?: string): Promise<{
  synced: number;
  failed: number;
  error?: string;
}> {
  if (!isPosSyncEnabled()) return { synced: 0, failed: 0 };

  const pending = listPendingSyncItems(outletId);
  if (!pending.length) return { synced: 0, failed: 0 };

  try {
    const serial = serializeStore(store());
    await cloudSavePos(serial);
    await cloudSave(serial);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sinkronisasi gagal";
    const now = new Date().toISOString();
    for (const item of pending) {
      item.failedAt = now;
      item.errorMessage = message;
      if (item.entity === "order") {
        const order = store().posOrders.find((o) => o.id === item.entityId);
        if (order) order.syncStatus = "failed";
      }
    }
    persistStore();
    return { synced: 0, failed: pending.length, error: message };
  }

  const now = new Date().toISOString();
  for (const item of pending) {
    item.syncedAt = now;
    item.failedAt = undefined;
    item.errorMessage = undefined;
    if (item.entity === "order") {
      const order = store().posOrders.find((o) => o.id === item.entityId);
      if (order) {
        order.syncStatus = "synced";
        order.syncedAt = now;
      }
    }
  }
  persistStore();
  return { synced: pending.length, failed: 0 };
}
