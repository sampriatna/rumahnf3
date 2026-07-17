import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildAuditEvent,
  clearAuditLogForTests,
  recentAuditLog,
  validateAuditEvent,
  type AuditEvent
} from "./audit-log";

describe("validateAuditEvent", () => {
  const base: AuditEvent = {
    id: "AUD-0001",
    at: new Date().toISOString(),
    action: "pos.void_item",
    actorName: "Leader KBU",
    outletId: "kbu",
    entityType: "pos_order_item",
    entityId: "OLI-0001",
    reason: "Salah input"
  };

  it("accepts complete payload", () => {
    expect(validateAuditEvent(base)).toHaveLength(0);
  });

  it("rejects missing actorName", () => {
    expect(validateAuditEvent({ ...base, actorName: "  " })).toContain("actorName wajib");
  });

  it("rejects invalid action", () => {
    expect(validateAuditEvent({ ...base, action: "pos.unknown" as AuditEvent["action"] })).toContain(
      "action tidak valid"
    );
  });
});

describe("recordAuditEvent", () => {
  beforeEach(() => {
    vi.resetModules();
    clearAuditLogForTests();
  });

  it("does not write when feature flag is off", async () => {
    process.env.NF3_FF_AUDIT_LOG_FOUNDATION = "false";
    const { recordAuditEvent } = await import("./audit-log");
    const event = recordAuditEvent({
      action: "finance.transfer",
      actorName: "Owner",
      entityType: "finance_transfer",
      entityId: "TRF-0001"
    });
    expect(event).toBeNull();
    expect(recentAuditLog()).toHaveLength(0);
  });

  it("writes ring buffer entry when flag is on", async () => {
    process.env.NF3_FF_AUDIT_LOG_FOUNDATION = "true";
    const { recordAuditEvent, recentAuditLog: recent } = await import("./audit-log");
    const event = recordAuditEvent({
      action: "pos.discount",
      actorName: "Kasir",
      outletId: "kbu",
      entityType: "pos_order",
      entityId: "ORD-0001",
      reason: "Manual discount",
      meta: { amount: 5000, kind: "manual" }
    });
    expect(event).not.toBeNull();
    expect(validateAuditEvent(event!)).toHaveLength(0);
    expect(recent(5)).toHaveLength(1);
    expect(recent(5)[0]).toMatchObject({
      action: "pos.discount",
      actorName: "Kasir",
      entityType: "pos_order",
      entityId: "ORD-0001"
    });
  });
});

describe("buildAuditEvent", () => {
  it("assigns id and timestamp", () => {
    const event = buildAuditEvent({
      action: "approval.decision",
      actorName: "Owner",
      entityType: "approval",
      entityId: "APR-0001",
      reason: "Approved"
    });
    expect(event.id).toMatch(/^AUD-/);
    expect(event.at).toBeTruthy();
    expect(validateAuditEvent(event)).toHaveLength(0);
  });
});
