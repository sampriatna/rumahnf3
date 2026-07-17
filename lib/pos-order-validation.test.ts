import { describe, expect, it, beforeEach } from "vitest";
import { validatePosOrderContext } from "./pos-order-validation";
import { ensureChannelsReady } from "./channel-service";

describe("validatePosOrderContext", () => {
  beforeEach(() => {
    ensureChannelsReady("kbu");
  });

  it("requires table for dine_in", () => {
    const r = validatePosOrderContext({
      outletId: "kbu",
      channel: "dine_in",
      tableLabel: ""
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain("Meja wajib");
  });

  it("allows takeaway without table", () => {
    const r = validatePosOrderContext({
      outletId: "kbu",
      channel: "takeaway"
    });
    expect(r.ok).toBe(true);
  });
});
