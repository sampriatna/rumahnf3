import { describe, expect, it, afterEach } from "vitest";
import {
  inventorySourceLabel,
  movementTypeLabel,
  movementTypeTone,
  resolveInventorySourceKind,
  transferStatusLabel,
  transferStatusTone
} from "./inventory-ui";

describe("resolveInventorySourceKind", () => {
  const prevInv = process.env.INVENTORY_SOURCE;
  const prevFin = process.env.FINANCE_SOURCE;

  afterEach(() => {
    if (prevInv === undefined) delete process.env.INVENTORY_SOURCE;
    else process.env.INVENTORY_SOURCE = prevInv;
    if (prevFin === undefined) delete process.env.FINANCE_SOURCE;
    else process.env.FINANCE_SOURCE = prevFin;
  });

  it("mengutamakan INVENTORY_SOURCE", () => {
    process.env.INVENTORY_SOURCE = "supabase";
    process.env.FINANCE_SOURCE = "sheets";
    expect(resolveInventorySourceKind()).toBe("supabase");
  });

  it("fallback ke FINANCE_SOURCE lalu dummy", () => {
    delete process.env.INVENTORY_SOURCE;
    process.env.FINANCE_SOURCE = "sheets";
    expect(resolveInventorySourceKind()).toBe("sheets");

    delete process.env.FINANCE_SOURCE;
    expect(resolveInventorySourceKind()).toBe("dummy");
  });
});

describe("inventorySourceLabel", () => {
  it("memberi label bahasa Indonesia per sumber", () => {
    expect(inventorySourceLabel("supabase")).toContain("Supabase");
    expect(inventorySourceLabel("sheets")).toContain("Sheets");
    expect(inventorySourceLabel("dummy")).toContain("demo");
  });
});

describe("transferStatusTone", () => {
  it("memetakan status transfer ke tone desain", () => {
    expect(transferStatusTone("approved")).toBe("progress");
    expect(transferStatusTone("sent")).toBe("active");
    expect(transferStatusTone("received")).toBe("success");
    expect(transferStatusTone("cancelled")).toBe("danger");
  });

  it("transferStatusLabel memakai label kanonik", () => {
    expect(transferStatusLabel("sent")).toBe("Dalam Pengiriman");
  });
});

describe("movementTypeLabel", () => {
  it("menormalisasi jenis mutasi umum", () => {
    expect(movementTypeLabel("barang_masuk")).toBe("Barang Masuk");
    expect(movementTypeLabel("waste")).toBe("Waste / Selisih");
    expect(movementTypeLabel("transfer_keluar")).toBe("Transfer Keluar");
    expect(movementTypeLabel("mutasi transfer")).toBe("Transfer Stok");
  });

  it("movementTypeTone mengikuti arah mutasi", () => {
    expect(movementTypeTone("barang masuk")).toBe("success");
    expect(movementTypeTone("transfer_keluar")).toBe("active");
    expect(movementTypeTone("waste outlet")).toBe("danger");
  });
});
