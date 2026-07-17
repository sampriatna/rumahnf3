import type { PosOrder } from "./pos-kds-roadmap";
import { store } from "./store";
import { OUTLETS, USERS } from "./mock-data";
import { POS_OUTLET_IDS, isPosOutlet } from "./pos-seed";
import { ensurePosSeeded } from "./pos-service";
import { outletDisplayName } from "./outlet-identity";

export type MenuPromoAction = "star" | "promote" | "push" | "hold";

export type MenuPromoInsight = {
  menuItemId: string;
  name: string;
  qty7d: number;
  qtyPrev7d: number;
  revenue7d: number;
  dowBaselineQty: number;
  trendPct: number;
  vsDowPct: number;
  action: MenuPromoAction;
  reason: string;
  suggestion: string;
};

export type MenuPromoReport = {
  outletId: string;
  outletName: string;
  periodLabel: string;
  insights: MenuPromoInsight[];
  generatedAt: string;
};

const ACTION_LABEL: Record<MenuPromoAction, string> = {
  star: "⭐ Star — pertahankan",
  promote: "📣 Promo — turun vs minggu lalu",
  push: "🚀 Push — di bawah normal hari ini",
  hold: "⏸ Hold — performa lemah"
};

function orderTimestamp(order: PosOrder) {
  return new Date(order.completedAt ?? order.paidAt ?? order.createdAt);
}

function aggregateItemSales(
  outletId: string,
  from: Date,
  to: Date
): Map<string, { qty: number; revenue: number; name: string }> {
  ensurePosSeeded();
  const map = new Map<string, { qty: number; revenue: number; name: string }>();

  for (const order of store().posOrders) {
    if (order.outletId !== outletId || order.status !== "completed") continue;
    const ts = orderTimestamp(order);
    if (ts < from || ts > to) continue;

    for (const line of order.items) {
      if (line.status === "void" || !line.menuItemId) continue;
      const cur = map.get(line.menuItemId) ?? {
        qty: 0,
        revenue: 0,
        name: line.nameSnapshot
      };
      cur.qty += line.qty;
      cur.revenue += line.lineTotal;
      map.set(line.menuItemId, cur);
    }
  }
  return map;
}

/** Rata-rata qty per minggu pada hari yang sama (Senin vs Senin, dll). */
function buildDowBaseline(
  outletId: string,
  before: Date
): Map<string, { totalQty: number; weeks: number }> {
  ensurePosSeeded();
  const weekBuckets = new Map<string, Map<string, number>>();

  for (const order of store().posOrders) {
    if (order.outletId !== outletId || order.status !== "completed") continue;
    const ts = orderTimestamp(order);
    if (ts >= before) continue;

    const dow = ts.getDay();
    const weekKey = `${ts.getFullYear()}-W${Math.floor(
      (ts.getTime() - new Date(ts.getFullYear(), 0, 1).getTime()) / (7 * 86400000)
    )}-${dow}`;

    if (!weekBuckets.has(weekKey)) weekBuckets.set(weekKey, new Map());
    const itemMap = weekBuckets.get(weekKey)!;

    for (const line of order.items) {
      if (line.status === "void" || !line.menuItemId) continue;
      itemMap.set(line.menuItemId, (itemMap.get(line.menuItemId) ?? 0) + line.qty);
    }
  }

  const agg = new Map<string, number[]>();
  for (const itemMap of weekBuckets.values()) {
    for (const [menuItemId, qty] of itemMap) {
      if (!agg.has(menuItemId)) agg.set(menuItemId, []);
      agg.get(menuItemId)!.push(qty);
    }
  }

  const result = new Map<string, { totalQty: number; weeks: number }>();
  for (const [menuItemId, samples] of agg) {
    result.set(menuItemId, {
      totalQty: samples.reduce((a, b) => a + b, 0),
      weeks: samples.length
    });
  }
  return result;
}

function classifyItem(input: {
  menuItemId: string;
  name: string;
  qty7d: number;
  qtyPrev7d: number;
  revenue7d: number;
  dowBaselineQty: number;
  maxRevenue7d: number;
}): MenuPromoInsight {
  const trendPct =
    input.qtyPrev7d > 0
      ? (input.qty7d - input.qtyPrev7d) / input.qtyPrev7d
      : input.qty7d > 0
        ? 1
        : 0;
  const vsDowPct =
    input.dowBaselineQty > 0 ? input.qty7d / input.dowBaselineQty : input.qty7d > 0 ? 1 : 0;

  let action: MenuPromoAction;
  let reason: string;
  let suggestion: string;

  const isTopSeller = input.revenue7d >= input.maxRevenue7d * 0.75 && input.qty7d >= 5;

  if (isTopSeller && trendPct >= -0.1) {
    action = "star";
    reason = `Best seller 7 hari (${input.qty7d} porsi · Rp ${input.revenue7d.toLocaleString("id-ID")}).`;
    suggestion = `Highlight di story & meja — bundling dengan side/minuman.`;
  } else if (trendPct <= -0.3 && input.qtyPrev7d >= 3) {
    action = "promote";
    reason = `Turun ${Math.round(Math.abs(trendPct) * 100)}% vs minggu lalu (${input.qtyPrev7d} → ${input.qty7d}).`;
    suggestion = `Flash diskon 10–15% hari ini atau combo dengan item star.`;
  } else if (vsDowPct <= 0.5 && input.dowBaselineQty >= 2) {
    action = "push";
    reason = `Hanya ${Math.round(vsDowPct * 100)}% dari normal historis hari serupa (~${input.dowBaselineQty.toFixed(1)}/minggu).`;
    suggestion = `Push di WA blast / Grab promo — foto fresh & caption urgency.`;
  } else if (input.qty7d <= 2 && input.qtyPrev7d <= 3) {
    action = "hold";
    reason = `Penjualan rendah konsisten (${input.qty7d} minggu ini).`;
    suggestion = `Evaluasi resep/harga — kurangi prep atau ganti slot menu.`;
  } else if (trendPct > 0.2) {
    action = "star";
    reason = `Naik ${Math.round(trendPct * 100)}% vs minggu lalu — momentum bagus.`;
    suggestion = `Capitalize: foto UGC + stiker "best seller minggu ini".`;
  } else {
    action = "promote";
    reason = `Stabil tapi belum optimal (${input.qty7d} porsi / 7 hari).`;
    suggestion = `Coba voucher member Rp 5rb–10rb khusus item ini.`;
  }

  return {
    menuItemId: input.menuItemId,
    name: input.name,
    qty7d: input.qty7d,
    qtyPrev7d: input.qtyPrev7d,
    revenue7d: input.revenue7d,
    dowBaselineQty: input.dowBaselineQty,
    trendPct,
    vsDowPct,
    action,
    reason,
    suggestion
  };
}

export function analyzeMenuPromo(outletId: string, now = new Date()): MenuPromoReport | null {
  if (!isPosOutlet(outletId)) return null;

  ensurePosSeeded();

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  const start7 = new Date(end);
  start7.setDate(start7.getDate() - 6);
  start7.setHours(0, 0, 0, 0);
  const startPrev = new Date(start7);
  startPrev.setDate(startPrev.getDate() - 7);
  const endPrev = new Date(start7);
  endPrev.setMilliseconds(-1);

  const sales7 = aggregateItemSales(outletId, start7, end);
  const salesPrev = aggregateItemSales(outletId, startPrev, endPrev);
  const dowBaseline = buildDowBaseline(outletId, start7);

  const menuItems = store().menuItems.filter((m) => m.outletId === outletId && m.active);
  const allIds = new Set([
    ...menuItems.map((m) => m.id),
    ...sales7.keys(),
    ...salesPrev.keys()
  ]);

  let maxRevenue7d = 0;
  for (const val of sales7.values()) {
    if (val.revenue > maxRevenue7d) maxRevenue7d = val.revenue;
  }

  const insights: MenuPromoInsight[] = [];
  for (const menuItemId of allIds) {
    const menu = menuItems.find((m) => m.id === menuItemId);
    const s7 = sales7.get(menuItemId);
    const sp = salesPrev.get(menuItemId);
    const qty7d = s7?.qty ?? 0;
    const qtyPrev7d = sp?.qty ?? 0;
    const revenue7d = s7?.revenue ?? 0;
    if (qty7d === 0 && qtyPrev7d === 0) continue;

    const dow = dowBaseline.get(menuItemId);
    const dowBaselineQty = dow && dow.weeks > 0 ? dow.totalQty / dow.weeks : 0;

    insights.push(
      classifyItem({
        menuItemId,
        name: menu?.name ?? s7?.name ?? menuItemId,
        qty7d,
        qtyPrev7d,
        revenue7d,
        dowBaselineQty,
        maxRevenue7d: Math.max(maxRevenue7d, 1)
      })
    );
  }

  insights.sort((a, b) => {
    const priority: Record<MenuPromoAction, number> = { promote: 0, push: 1, star: 2, hold: 3 };
    const pa = priority[a.action];
    const pb = priority[b.action];
    if (pa !== pb) return pa - pb;
    return b.revenue7d - a.revenue7d;
  });

  return {
    outletId,
    outletName: outletDisplayName(outletId),
    periodLabel: `${start7.toLocaleDateString("id-ID")} – ${end.toLocaleDateString("id-ID")}`,
    insights: insights.slice(0, 8),
    generatedAt: now.toISOString()
  };
}

export function formatMenuPromoWa(report: MenuPromoReport, limit = 5) {
  const lines = [
    `[REKOMENDASI MENU · ${report.outletName.toUpperCase()}]`,
    `Periode: ${report.periodLabel}`,
    ""
  ];

  for (const item of report.insights.slice(0, limit)) {
    lines.push(`${ACTION_LABEL[item.action]}`);
    lines.push(`${item.name}: ${item.qty7d} porsi (7 hari)`);
    lines.push(`→ ${item.suggestion}`);
    lines.push("");
  }

  lines.push("— Rumah NF3 · dashboard outlet untuk detail lengkap.");
  return lines.join("\n");
}

export function leaderPhone(outletId: string) {
  const leader = USERS.find((u) => u.role === "leader" && u.outletId === outletId);
  return leader?.phone ?? USERS.find((u) => u.role === "owner")?.phone;
}

export function recentMenuPromoAlerts(limit = 5) {
  return store()
    .notificationLogs.filter((l) => l.event === "menu_promo")
    .slice(0, limit);
}
