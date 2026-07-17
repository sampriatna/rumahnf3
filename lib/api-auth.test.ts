import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionPayload } from "./session-token";

const { mockGetSession } = vi.hoisted(() => ({
  mockGetSession: vi.fn()
}));

vi.mock("./session", () => ({
  getSession: mockGetSession
}));

function sampleSession(overrides: Partial<SessionPayload> = {}): SessionPayload {
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

describe("requireApiAuthz", () => {
  beforeEach(() => {
    mockGetSession.mockReset();
  });

  it("returns 401 when session missing", async () => {
    mockGetSession.mockReturnValue(null);
    const { requireApiAuthz } = await import("./api-auth");
    const result = requireApiAuthz({ global: true });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("returns 403 when capability missing", async () => {
    mockGetSession.mockReturnValue(sampleSession({ capabilities: ["forms"] }));
    const { requireApiAuthz } = await import("./api-auth");
    const result = requireApiAuthz({ capability: "pos" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });

  it("returns session when global access passes", async () => {
    mockGetSession.mockReturnValue(sampleSession({ role: "owner" }));
    const { requireApiAuthz } = await import("./api-auth");
    const result = requireApiAuthz({ global: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.session.role).toBe("owner");
    }
  });

  it("returns 403 when outlet access denied", async () => {
    mockGetSession.mockReturnValue(sampleSession({ role: "leader", outletId: "kbu" }));
    const { requireApiAuthz } = await import("./api-auth");
    const result = requireApiAuthz({ roles: ["leader"], outletId: "kisamen" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(403);
    }
  });
});

describe("requireOpsDiagnosticsAuth", () => {
  const baseEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...baseEnv };
    mockGetSession.mockReset();
  });

  it("allows bearer CRON_SECRET without session", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    mockGetSession.mockReturnValue(null);
    const { requireOpsDiagnosticsAuth } = await import("./api-auth");
    const req = new Request("http://localhost/api/cloud-status", {
      headers: { authorization: "Bearer test-cron-secret" }
    });
    const result = requireOpsDiagnosticsAuth(req);
    expect(result.ok).toBe(true);
  });

  it("allows owner session without cron secret", async () => {
    delete process.env.CRON_SECRET;
    mockGetSession.mockReturnValue(sampleSession({ role: "owner" }));
    const { requireOpsDiagnosticsAuth } = await import("./api-auth");
    const req = new Request("http://localhost/api/cloud-status");
    const result = requireOpsDiagnosticsAuth(req);
    expect(result.ok).toBe(true);
    if (result.ok && "session" in result) {
      expect(result.session?.role).toBe("owner");
    }
  });
});
