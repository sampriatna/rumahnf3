import { getPendingSyncCount as countFromQueue, isPosSyncEnabled } from "./pos-sync-queue";

export { getPendingSyncCount } from "./pos-sync-queue";

export function hasPendingSync(outletId?: string): boolean {
  if (!isPosSyncEnabled()) return false;
  return countFromQueue(outletId) > 0;
}
