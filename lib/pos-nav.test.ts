import { describe, expect, it } from "vitest";
import {
  activePosNavId,
  canSeePosNavItem,
  filterPosNavForRole,
  posNavHref,
  POS_DRAWER_NAV
} from "./pos-nav";

describe("pos-nav", () => {
  it("maps paths to active nav id", () => {
    expect(activePosNavId("/pos")).toBe("sell");
    expect(activePosNavId("/pos/shift")).toBe("shift");
    expect(activePosNavId("/pos/close")).toBe("shift");
    expect(activePosNavId("/pos/history")).toBe("history");
    expect(activePosNavId("/pos/sync")).toBe("sync");
  });

  it("filters admin-only items for staff", () => {
    const staff = filterPosNavForRole("staff");
    expect(staff.some((i) => i.id === "settings")).toBe(false);
    expect(staff.some((i) => i.id === "sell")).toBe(true);
  });

  it("shows settings for leader", () => {
    expect(canSeePosNavItem(POS_DRAWER_NAV.find((i) => i.id === "settings")!, "leader")).toBe(
      true
    );
  });

  it("builds href with outlet", () => {
    expect(posNavHref("history", "kbu")).toBe("/pos/history?outlet=kbu");
    expect(posNavHref("shift", "kbu", "sh-1")).toBe("/pos/shift?outlet=kbu&shift=sh-1");
  });
});
