import { describe, it, expect } from "vitest";
import type { KdsOrderTicket } from "@/types/kds";
import {
  stationStatus,
  overallOrderLabel,
  timerSeconds,
  itemsForStation
} from "./kds-board-utils";
import { kdsTimerTier } from "./kds-theme";

const sample: KdsOrderTicket = {
  ticketId: "t1",
  orderId: "o1",
  outletId: "kbu",
  orderType: "dine_in",
  orderNumber: "KBU-1",
  tableNumber: "12",
  station: "dapur",
  status: "diproces",
  priority: 0,
  createdAt: new Date(Date.now() - 6 * 60_000).toISOString(),
  items: [
    {
      itemId: "i1",
      ticketId: "t1",
      menuName: "Nasi Goreng",
      qty: 1,
      modifiers: [],
      status: "siap",
      station: "dapur"
    },
    {
      itemId: "i2",
      ticketId: "t1",
      menuName: "Latte",
      qty: 1,
      modifiers: [],
      status: "diproces",
      station: "bar"
    }
  ]
};

describe("kds-board-utils", () => {
  it("stationStatus per station", () => {
    expect(stationStatus(sample, "dapur")).toBe("siap");
    expect(stationStatus(sample, "bar")).toBe("diproces");
  });

  it("overall belum lengkap jika satu station belum siap", () => {
    expect(overallOrderLabel(sample)).toBe("Belum Lengkap");
  });

  it("itemsForStation filters", () => {
    expect(itemsForStation(sample, "bar")).toHaveLength(1);
  });

  it("timerSeconds positive", () => {
    expect(timerSeconds(sample)).toBeGreaterThanOrEqual(350);
  });
});

describe("kdsTimerTier", () => {
  it("tiers by minutes", () => {
    expect(kdsTimerTier(120)).toBe("normal");
    expect(kdsTimerTier(360)).toBe("warning");
    expect(kdsTimerTier(660)).toBe("orange");
    expect(kdsTimerTier(960)).toBe("late");
  });
});
