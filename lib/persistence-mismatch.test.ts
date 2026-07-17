import { describe, expect, it, vi } from "vitest";
import { compareDomainMetrics } from "./persistence-mismatch";

describe("compareDomainMetrics", () => {
  it("detects memory vs relational mismatch", () => {
    const at = new Date().toISOString();
    const mismatches = compareDomainMetrics({
      domain: "pos",
      at,
      memory: { posOrders: 5, posShifts: 1 },
      relational: { posOrders: 3, posShifts: 1 },
      metrics: ["posOrders", "posShifts"]
    });

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({
      domain: "pos",
      metric: "posOrders",
      memory: 5,
      relational: 3
    });
  });

  it("detects memory vs app_state mismatch when relational matches", () => {
    const at = new Date().toISOString();
    const mismatches = compareDomainMetrics({
      domain: "finance",
      at,
      memory: { ledger: 10 },
      relational: { ledger: 10 },
      appState: { ledger: 8 },
      metrics: ["ledger"]
    });

    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({
      domain: "finance",
      metric: "ledger",
      memory: 10,
      relational: 10,
      appState: 8
    });
  });

  it("returns empty when all sources align", () => {
    const mismatches = compareDomainMetrics({
      domain: "forms",
      at: new Date().toISOString(),
      memory: { submissions: 4, approvals: 2 },
      relational: { submissions: 4, approvals: 2 },
      appState: { submissions: 4, approvals: 2 },
      metrics: ["submissions", "approvals"]
    });

    expect(mismatches).toHaveLength(0);
  });
});

describe("auditPersistenceMismatch", () => {
  it("returns disabled report when feature flag is off", async () => {
    vi.resetModules();
    process.env.NF3_FF_PERSISTENCE_MISMATCH_LOG = "false";
    const { auditPersistenceMismatch } = await import("./persistence-mismatch");
    const report = await auditPersistenceMismatch();
    expect(report.enabled).toBe(false);
    expect(report.domains).toHaveLength(0);
  });
});
