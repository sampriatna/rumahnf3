import { describe, expect, it, beforeEach } from "vitest";
import { store } from "./store";
import { ensurePrimaryPosChannels, listSalesChannels } from "./channel-service";

describe("ensurePrimaryPosChannels", () => {
  beforeEach(() => {
    store().salesChannels = store().salesChannels.filter((c) => c.outletId !== "kbu");
    store().salesChannels.push({
      id: "dine_in",
      outletId: "kbu",
      name: "Dine In",
      kind: "dine_in",
      requiresTable: true,
      sortOrder: 1,
      isDefault: true,
      active: true
    });
  });

  it("adds missing delivery_own without removing existing channels", () => {
    ensurePrimaryPosChannels("kbu");
    const channels = listSalesChannels("kbu");
    expect(channels.some((c) => c.id === "delivery_own")).toBe(true);
    expect(channels.some((c) => c.id === "dine_in")).toBe(true);
  });
});
