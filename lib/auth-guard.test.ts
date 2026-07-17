import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionPayload } from "./session-token";

const { mockGetSession, mockRedirect } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockRedirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT:${to}`);
  })
}));

vi.mock("./session", () => ({
  getSession: mockGetSession
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect
}));

function sampleSession(
  overrides: Partial<SessionPayload> = {}
): SessionPayload {
  return {
    sub: "u-1",
    role: "staff",
    name: "Tester",
    outletId: "kbu",
    capabilities: ["forms"],
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides
  };
}

describe("requireAuthz", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
    mockRedirect.mockClear();
  });

  it("returns session when requirements pass", async () => {
    mockGetSession.mockReturnValue(sampleSession({ capabilities: ["pos"] }));
    const { requireAuthz } = await import("./auth-guard");
    const session = requireAuthz({
      capability: "pos",
      outletId: "kbu",
      redirectTo: "/pos/login"
    });
    expect(session.role).toBe("staff");
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("redirects when capability requirement fails", async () => {
    mockGetSession.mockReturnValue(sampleSession({ capabilities: ["forms"] }));
    const { requireAuthz } = await import("./auth-guard");
    expect(() =>
      requireAuthz({
        capability: "pos",
        redirectTo: "/pos/login"
      })
    ).toThrow("REDIRECT:/pos/login");
  });

  it("redirects when outlet access is denied", async () => {
    mockGetSession.mockReturnValue(sampleSession({ capabilities: ["kds"], outletId: "kbu" }));
    const { requireAuthz } = await import("./auth-guard");
    expect(() =>
      requireAuthz({
        capability: "kds",
        outletId: "kisamen",
        redirectTo: "/dashboard"
      })
    ).toThrow("REDIRECT:/dashboard?error=outlet-denied");
  });
});
