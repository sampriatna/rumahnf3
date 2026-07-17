import type { PosOrder } from "./pos-kds-roadmap";
import { store, nextId, addNotificationLog } from "./store";
import { USERS } from "./mock-data";
import { outletDisplayName } from "./outlet-identity";
import { POS_OUTLET_IDS, isPosOutlet } from "./pos-seed";
import { ensurePosSeeded } from "./pos-service";
import { sendWaNotification, type NotificationLog } from "./wa";
import { analyzeMenuPromo, formatMenuPromoWa } from "./ops-menu-promo";

/** Nama hari — indeks = Date.getDay() (0=Minggu). */
export const DOW_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;

const WINDOW_HOURS = 2;
const QUIET_RATIO = 0.45;
const COOLDOWN_MS = 3 * 60 * 60 * 1000;
const MIN_WEEKS_FOR_EMPIRICAL = 3;
const OPEN_HOUR = 8;
const CLOSE_HOUR = 22;

/** Bobot relatif order per jam. Weekend lebih tinggi. */
const WEEKDAY_HOURLY = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0.4, 0.7, 1.0, 1.8, 2.2, 1.6, 0.9, 0.7, 0.8, 1.2, 1.8, 2.0, 1.4, 0.6,
  0.2, 0
];
const WEEKEND_HOURLY = [
  0, 0, 0, 0, 0, 0, 0, 0,
  0.8, 1.4, 2.2, 2.8, 3.0, 2.4, 1.8, 1.6, 1.8, 2.2, 2.8, 3.2, 2.4, 1.2,
  0.4, 0
];

export type QuietHourOutletStatus = {
  outletId: string;
  outletName: string;
  dayLabel: string;
  isWeekend: boolean;
  windowLabel: string;
  windowActualOrders: number;
  windowExpectedOrders: number;
  windowActualRevenue: number;
  windowExpectedRevenue: number;
  windowPct: number;
  todayActualOrders: number;
  todayExpectedOrders: number;
  todayPct: number;
  isQuiet: boolean;
  reasons: string[];
  suggestions: string[];
  lastAlertAt?: string;
  canAlert: boolean;
};

export type QuietHourCheckResult = {
  checkedAt: string;
  alerts: NotificationLog[];
  statuses: QuietHourOutletStatus[];
};

type BaselineCell = { avgOrders: number; avgRevenue: number; weeks: number };
type BaselineGrid = Record<number, Record<number, BaselineCell>>;

function isWeekend(dow: number) {
  return dow === 0 || dow === 6;
}

function hourProfile(dow: number) {
  return isWeekend(dow) ? WEEKEND_HOURLY : WEEKDAY_HOURLY;
}

function orderTimestamp(order: PosOrder) {
  return new Date(order.completedAt ?? order.paidAt ?? order.createdAt);
}

function inHourRange(h: number) {
  return h >= OPEN_HOUR && h <= CLOSE_HOUR;
}

function buildEmpiricalBaseline(outletId: string, before: Date): BaselineGrid {
  ensurePosSeeded();
  const weekBuckets = new Map<string, Map<number, { orders: number; revenue: number }>>();

  for (const order of store().posOrders) {
    if (order.outletId !== outletId || order.status !== "completed") continue;
    const ts = orderTimestamp(order);
    if (ts >= before) continue;
    const dow = ts.getDay();
    const hour = ts.getHours();
    if (!inHourRange(hour)) continue;

    const weekKey = `${ts.getFullYear()}-W${Math.floor(
      (ts.getTime() - new Date(ts.getFullYear(), 0, 1).getTime()) / (7 * 86400000)
    )}-${dow}`;
    if (!weekBuckets.has(weekKey)) weekBuckets.set(weekKey, new Map());
    const hourMap = weekBuckets.get(weekKey)!;
    const cur = hourMap.get(hour) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += order.total;
    hourMap.set(hour, cur);
  }

  const agg = new Map<string, { orders: number[]; revenue: number[] }>();
  for (const [weekKey, hourMap] of weekBuckets) {
    const dow = Number(weekKey.split("-").pop());
    for (const [hour, val] of hourMap) {
      const key = `${dow}-${hour}`;
      if (!agg.has(key)) agg.set(key, { orders: [], revenue: [] });
      agg.get(key)!.orders.push(val.orders);
      agg.get(key)!.revenue.push(val.revenue);
    }
  }

  const result: BaselineGrid = {};
  for (let dow = 0; dow < 7; dow++) {
    result[dow] = {};
    for (let hour = OPEN_HOUR; hour <= CLOSE_HOUR; hour++) {
      const samples = agg.get(`${dow}-${hour}`);
      if (samples && samples.orders.length >= MIN_WEEKS_FOR_EMPIRICAL) {
        result[dow][hour] = {
          avgOrders: samples.orders.reduce((a, b) => a + b, 0) / samples.orders.length,
          avgRevenue: samples.revenue.reduce((a, b) => a + b, 0) / samples.revenue.length,
          weeks: samples.orders.length
        };
      }
    }
  }
  return result;
}

function templateExpected(outletId: string, dow: number, hour: number): BaselineCell {
  const profile = hourProfile(dow);
  const scale = outletId === "samtaro" ? 0.85 : outletId === "kisamen" ? 1.1 : 1;
  const weight = profile[hour] ?? 0;
  return {
    avgOrders: Math.max(0.3, weight * 0.55 * scale),
    avgRevenue: Math.max(15_000, weight * 45_000 * scale),
    weeks: 0
  };
}

function expectedFor(outletId: string, dow: number, hour: number, empirical: BaselineGrid): BaselineCell {
  return empirical[dow]?.[hour] ?? templateExpected(outletId, dow, hour);
}

function sumWindowExpected(outletId: string, dow: number, hours: number[], empirical: BaselineGrid) {
  let orders = 0;
  let revenue = 0;
  for (const h of hours) {
    const e = expectedFor(outletId, dow, h, empirical);
    orders += e.avgOrders;
    revenue += e.avgRevenue;
  }
  return { orders, revenue };
}

function ordersInRange(outletId: string, from: Date, to: Date) {
  ensurePosSeeded();
  return store().posOrders.filter((o) => {
    if (o.outletId !== outletId || o.status !== "completed") return false;
    const ts = orderTimestamp(o);
    return ts >= from && ts <= to;
  });
}

function contentSuggestions(outletName: string, wknd: boolean, windowPct: number): string[] {
  const tips: string[] = [];
  if (wknd) {
    tips.push("Weekend biasanya lebih ramai — cek staffing & stok bahan populer.");
    tips.push("Story IG: promo bundle keluarga / buy 2 get 1 minuman.");
    tips.push("Aktifkan diskon Grab/GoFood 15–20% khusus weekend.");
  } else {
    tips.push("Hari kerja — fokus pelanggan kantor & takeaway siang.");
    tips.push("Flash promo 15:00–17:00 (happy hour kopi/snack).");
    tips.push("WA blast ke member tidak aktif 30 hari (segment winback).");
  }
  if (windowPct < 0.25) {
    tips.push(`Traffic sangat rendah di ${outletName} — live TikTok singkat + voucher hari ini.`);
  }
  return tips.slice(0, 4);
}

export function formatQuietHourWa(status: QuietHourOutletStatus, includeMenuPromo = true) {
  const lines = [
    `[JAM SEPI · ${status.outletName.toUpperCase()}]`,
    `Hari: ${status.dayLabel}${status.isWeekend ? " (weekend — ekspektasi lebih ramai)" : " (hari kerja)"}`,
    `Window ${status.windowLabel}: ${status.windowActualOrders} order (${Math.round(status.windowPct * 100)}% dari normal ${status.dayLabel})`,
    `Ekspektasi window: ~${status.windowExpectedOrders.toFixed(1)} order · Rp ${Math.round(status.windowExpectedRevenue).toLocaleString("id-ID")}`,
    `Hari ini total: ${status.todayActualOrders} vs normal ~${status.todayExpectedOrders.toFixed(1)} order`,
    "",
    "Saran konten/promo:",
    ...status.suggestions.map((s, i) => `${i + 1}. ${s}`)
  ];

  if (includeMenuPromo) {
    const promo = analyzeMenuPromo(status.outletId);
    const pushItems = promo?.insights.filter((i) => i.action === "promote" || i.action === "push").slice(0, 2);
    if (pushItems && pushItems.length > 0) {
      lines.push("", "Menu yang perlu di-push:");
      for (const item of pushItems) {
        lines.push(`• ${item.name} — ${item.suggestion}`);
      }
    }
  }

  lines.push("", "— Rumah NF3 · cek dashboard outlet untuk detail.");
  return lines.join("\n");
}

function leaderPhone(outletId: string) {
  const leader = USERS.find((u) => u.role === "leader" && u.outletId === outletId);
  return leader?.phone ?? USERS.find((u) => u.role === "owner")?.phone;
}

function setLastAlert(outletId: string, at: string) {
  const s = store();
  if (!s.quietHourLastAlert) s.quietHourLastAlert = {};
  s.quietHourLastAlert[outletId] = at;
}

export function evaluateQuietHourForOutlet(
  outletId: string,
  now = new Date()
): QuietHourOutletStatus | null {
  if (!isPosOutlet(outletId)) return null;

  const dow = now.getDay();
  const hour = now.getHours();
  if (!inHourRange(hour)) return null;

  const beforeToday = new Date(now);
  beforeToday.setHours(0, 0, 0, 0);
  const empirical = buildEmpiricalBaseline(outletId, beforeToday);

  const windowHours: number[] = [];
  for (let h = hour - WINDOW_HOURS + 1; h <= hour; h++) {
    if (inHourRange(h)) windowHours.push(h);
  }
  if (windowHours.length === 0) return null;

  const windowStart = new Date(now);
  windowStart.setHours(windowHours[0], 0, 0, 0);

  const windowOrders = ordersInRange(outletId, windowStart, now);
  const windowExp = sumWindowExpected(outletId, dow, windowHours, empirical);

  const dayStart = new Date(now);
  dayStart.setHours(OPEN_HOUR, 0, 0, 0);
  const todayOrders = ordersInRange(outletId, dayStart, now);
  const todayHours: number[] = [];
  for (let h = OPEN_HOUR; h <= hour; h++) todayHours.push(h);
  const todayExp = sumWindowExpected(outletId, dow, todayHours, empirical);

  const windowPct = windowExp.orders > 0 ? windowOrders.length / windowExp.orders : 1;
  const todayPct = todayExp.orders > 0 ? todayOrders.length / todayExp.orders : 1;

  const reasons: string[] = [];
  const isQuietWindow = windowExp.orders >= 1.2 && windowPct <= QUIET_RATIO;
  const isQuietDay = todayExp.orders >= 3 && todayPct <= QUIET_RATIO;
  if (isQuietWindow) {
    reasons.push(
      `${WINDOW_HOURS} jam terakhir hanya ${Math.round(windowPct * 100)}% dari rata-rata ${DOW_ID[dow]} jam ${windowHours[0]}–${hour}.`
    );
  }
  if (isQuietDay && isWeekend(dow)) {
    reasons.push(`Weekend tapi penjualan hari ini baru ${Math.round(todayPct * 100)}% dari normal ${DOW_ID[dow]}.`);
  }

  const quiet = isQuietWindow || (isQuietDay && isWeekend(dow));
  const wknd = isWeekend(dow);
  const lastAt = store().quietHourLastAlert?.[outletId];
  const canAlert = quiet && (!lastAt || now.getTime() - new Date(lastAt).getTime() >= COOLDOWN_MS);

  return {
    outletId,
    outletName: outletDisplayName(outletId),
    dayLabel: DOW_ID[dow],
    isWeekend: wknd,
    windowLabel: `${String(windowHours[0]).padStart(2, "0")}:00–${String(hour).padStart(2, "0")}:59`,
    windowActualOrders: windowOrders.length,
    windowExpectedOrders: Math.round(windowExp.orders * 10) / 10,
    windowActualRevenue: windowOrders.reduce((s, o) => s + o.total, 0),
    windowExpectedRevenue: windowExp.revenue,
    windowPct,
    todayActualOrders: todayOrders.length,
    todayExpectedOrders: Math.round(todayExp.orders * 10) / 10,
    todayPct,
    isQuiet: quiet,
    reasons,
    suggestions: quiet ? contentSuggestions(outletDisplayName(outletId), wknd, windowPct) : [],
    lastAlertAt: lastAt,
    canAlert
  };
}

export async function runQuietHourCheck(options?: {
  outletId?: string;
  now?: Date;
  force?: boolean;
  sendWa?: boolean;
}): Promise<QuietHourCheckResult> {
  ensurePosSeeded();
  ensureTrafficHistorySeeded();

  const now = options?.now ?? new Date();
  const outlets = options?.outletId ? [options.outletId] : [...POS_OUTLET_IDS];

  const statuses: QuietHourOutletStatus[] = [];
  const alerts: NotificationLog[] = [];

  for (const oid of outlets) {
    const status = evaluateQuietHourForOutlet(oid, now);
    if (!status) continue;
    statuses.push(status);

    const shouldSend =
      options?.sendWa !== false &&
      status.isQuiet &&
      (status.canAlert || options?.force);

    if (shouldSend) {
      const log = await sendWaNotification({
        event: "quiet_hour",
        target: "leader",
        phone: leaderPhone(oid),
        outletId: oid,
        message: formatQuietHourWa(status)
      });
      addNotificationLog(log);
      setLastAlert(oid, now.toISOString());
      alerts.push(log);
    }
  }

  return { checkedAt: now.toISOString(), alerts, statuses };
}

/** Seed ~8 minggu riwayat transaksi demo agar baseline per hari terisi. */
export function ensureTrafficHistorySeeded() {
  const s = store();
  if (s.quietTrafficSeeded) return;
  ensurePosSeeded();

  const completed = s.posOrders.filter((o) => o.status === "completed").length;
  if (completed >= 80) {
    s.quietTrafficSeeded = true;
    return;
  }

  const now = new Date();
  const menuByOutlet = new Map<string, number[]>();
  for (const item of s.menuItems) {
    if (!menuByOutlet.has(item.outletId)) menuByOutlet.set(item.outletId, []);
    menuByOutlet.get(item.outletId)!.push(item.basePrice);
  }

  for (const outletId of POS_OUTLET_IDS) {
    const prices = menuByOutlet.get(outletId) ?? [25_000, 35_000, 45_000];
    for (let dayOffset = 1; dayOffset <= 56; dayOffset++) {
      const day = new Date(now);
      day.setDate(day.getDate() - dayOffset);
      const dow = day.getDay();
      const profile = hourProfile(dow);
      const scale = outletId === "samtaro" ? 0.85 : outletId === "kisamen" ? 1.1 : 1;

      for (let hour = OPEN_HOUR; hour <= CLOSE_HOUR; hour++) {
        const expected = profile[hour] * scale;
        const orderCount = Math.max(0, Math.round(expected + (Math.random() - 0.5) * 1.2));
        for (let i = 0; i < orderCount; i++) {
          const ts = new Date(day);
          ts.setHours(hour, Math.floor(Math.random() * 50), 0, 0);
          const outletMenu = s.menuItems.filter((m) => m.outletId === outletId && m.active);
          const pick =
            outletMenu.length > 0
              ? outletMenu[Math.floor(Math.random() * outletMenu.length)]
              : undefined;
          const price = pick?.basePrice ?? prices[Math.floor(Math.random() * prices.length)];
          const qty = 1 + (Math.random() > 0.7 ? 1 : 0);
          s.posOrders.push({
            id: nextId("ORD"),
            outletId,
            orderNumber: `HIST-${outletId}-${dayOffset}-${hour}-${i}`,
            channel: "dine_in",
            status: "completed",
            paymentStatus: "paid",
            subtotal: price * qty,
            discountAmount: 0,
            taxAmount: 0,
            serviceChargeAmount: 0,
            total: price * qty,
            createdAt: ts.toISOString(),
            paidAt: ts.toISOString(),
            completedAt: ts.toISOString(),
            items: pick
              ? [
                  {
                    id: nextId("LI"),
                    menuItemId: pick.id,
                    nameSnapshot: pick.name,
                    qty,
                    unitPrice: price,
                    modifiersSnapshot: [],
                    lineTotal: price * qty,
                    status: "served" as const
                  }
                ]
              : [],
            payments: []
          });
        }
      }
    }
  }

  s.quietTrafficSeeded = true;
}

export function recentQuietHourAlerts(limit = 10) {
  return store()
    .notificationLogs.filter((l) => l.event === "quiet_hour")
    .slice(0, limit);
}
