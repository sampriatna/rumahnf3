import { describe, expect, it } from "vitest";
import { outletDisplayName, getOutletByIdentity, resolveOutletIdentity, toOutletCode, toOutletSlug } from "./outlet-identity";

describe("outlet identity resolver", () => {
  it("resolves by slug", () => {
    const o = resolveOutletIdentity("kbu");
    expect(o?.slug).toBe("kbu");
    expect(o?.code).toBe("KBU");
  });

  it("resolves by code", () => {
    const o = resolveOutletIdentity("ksm");
    expect(o?.slug).toBe("kisamen");
    expect(o?.code).toBe("KSM");
  });

  it("resolves by uuid", () => {
    const o = resolveOutletIdentity("9a7b7e8c-6835-4322-a98a-8f3a016e6f8f");
    expect(o?.slug).toBe("samtaro");
  });

  it("normalizes helpers", () => {
    expect(toOutletSlug("KBU")).toBe("kbu");
    expect(toOutletCode("kisamen")).toBe("KSM");
    expect(outletDisplayName("kbu")).toBe("Kopi Buri Umah");
  });

  it("returns outlet record by identity", () => {
    const outlet = getOutletByIdentity("KBU");
    expect(outlet?.id).toBe("kbu");
    expect(outlet?.name).toBe("Kopi Buri Umah");
    expect(getOutletByIdentity("unknown-outlet")).toBeNull();
  });
});
