"use client";

import { useEffect, useRef } from "react";
import type { KdsOrderTicket } from "@/types/kds";
import { loadKdsSoundSettings, playKdsAlert } from "@/lib/kds-sound";
import { stationStatus } from "@/lib/kds-board-utils";
import type { KdsStationId } from "@/types/kds";

type Props = {
  tickets: KdsOrderTicket[];
  outletId: string;
  stationId: KdsStationId;
};

/**
 * Monitor order baru & alert ulang jika BARU > repeatInterval tanpa diproses.
 */
export function KdsAlertMonitor({ tickets, outletId, stationId }: Props) {
  const seenRef = useRef<Set<string>>(new Set());
  const lastAlertRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const settings = loadKdsSoundSettings();
    if (!settings.enabled) return;

    const now = Date.now();

    for (const t of tickets) {
      const st = stationStatus(t, stationId);
      const key = `${outletId}:${stationId}:${t.ticketId}`;

      if (!seenRef.current.has(key)) {
        seenRef.current.add(key);
        if (st === "baru") {
          playKdsAlert(settings.volume);
          lastAlertRef.current[key] = now;
        }
        continue;
      }

      if (st !== "baru" || t.startedAt) continue;

      const elapsed = (now - new Date(t.createdAt).getTime()) / 1000;
      if (elapsed < 60) continue;

      const last = lastAlertRef.current[key] ?? 0;
      if (now - last >= settings.repeatIntervalSec * 1000) {
        playKdsAlert(settings.volume);
        lastAlertRef.current[key] = now;
      }
    }
  }, [tickets, outletId, stationId]);

  return null;
}
