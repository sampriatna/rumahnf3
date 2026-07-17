import { describe, expect, it } from "vitest";
import { channelLabelIndonesia, POS_PRIMARY_CHANNEL_KINDS } from "./pos-channel-labels";

describe("pos-channel-labels", () => {
  it("maps primary channel kinds to Indonesian labels", () => {
    expect(channelLabelIndonesia("dine_in", "Dine In", "dine_in")).toBe("Makan di Tempat");
    expect(channelLabelIndonesia("takeaway", "Takeaway", "takeaway")).toBe("Bawa Pulang");
    expect(channelLabelIndonesia("delivery", "Delivery", "delivery_own")).toBe("Pesan Antar");
  });

  it("lists three primary POS channel kinds", () => {
    expect(POS_PRIMARY_CHANNEL_KINDS).toContain("dine_in");
    expect(POS_PRIMARY_CHANNEL_KINDS).toContain("takeaway");
    expect(POS_PRIMARY_CHANNEL_KINDS).toContain("delivery_own");
  });
});
