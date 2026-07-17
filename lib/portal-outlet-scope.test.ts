import { describe, expect, it, vi } from "vitest";
import { resolvePortalOutletScope, isPortalAllOutletsScope, resolveLibraryOutletId } from "./portal-outlet-scope";

vi.mock("./shell-outlet", () => ({
  readShellOutletCookie: vi.fn(() => "kbu")
}));

describe("resolvePortalOutletScope", () => {
  it("leader uses session outlet", () => {
    expect(
      resolvePortalOutletScope({ role: "leader", outletId: "kbu" })
    ).toBe("kbu");
  });

  it("owner prefers explicit outlet param", () => {
    expect(
      resolvePortalOutletScope({ role: "owner", outletId: undefined }, "kisamen")
    ).toBe("kisamen");
  });

  it("owner falls back to shell cookie", () => {
    expect(
      resolvePortalOutletScope({ role: "owner", outletId: undefined })
    ).toBe("kbu");
  });

  it("detects all-outlets scope", () => {
    expect(isPortalAllOutletsScope({ role: "owner" })).toBe(false);
  });
});

describe("resolveLibraryOutletId", () => {
  const fnb = [{ id: "kbu" }, { id: "kisamen" }];

  it("uses shell cookie when no explicit outlet", () => {
    expect(
      resolveLibraryOutletId({ role: "owner", outletId: undefined }, undefined, fnb)
    ).toBe("kbu");
  });

  it("falls back to first F&B outlet", () => {
    expect(
      resolveLibraryOutletId({ role: "leader", outletId: undefined }, undefined, fnb)
    ).toBe("kbu");
  });
});
