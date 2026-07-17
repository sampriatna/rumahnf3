import { describe, it, expect } from "vitest";
import { computeClosingOpnameRows } from "./kds-closing-service";
import type { InventoryMovementBundle } from "./inventory-metrics";

const emptyBundle: InventoryMovementBundle = {
  opname: [{ tanggal: "2026-06-01", kodeBahan: "BH-A", lokasi: "KBU", qtyAwal: 10 }],
  masuk: [],
  transfer: [],
  pemakaian: [],
  waste: []
};

describe("computeClosingOpnameRows", () => {
  it("mencatat pemakaian closing bila fisik < sistem", () => {
    const r = computeClosingOpnameRows({
      kodeBahan: "BH-A",
      lokasi: "KBU",
      stokFisik: 6,
      pic: "Leader",
      satuanPakai: "kg",
      bundle: emptyBundle,
      now: "2026-06-13T22:00:00Z"
    });
    expect(r.sistem).toBe(10);
    expect(r.delta).toBe(4);
    expect(r.pemakaian?.jenisPemakaian).toBe("Closing Opname");
    expect(r.pemakaian?.qty).toBe(4);
  });

  it("mencatat barang masuk koreksi bila fisik > sistem", () => {
    const r = computeClosingOpnameRows({
      kodeBahan: "BH-A",
      lokasi: "KBU",
      stokFisik: 12,
      pic: "Leader",
      satuanPakai: "kg",
      bundle: emptyBundle,
      now: "2026-06-13T22:00:00Z"
    });
    expect(r.delta).toBe(-2);
    expect(r.barangMasuk?.qty).toBe(2);
    expect(r.barangMasuk?.supplier).toBe("Koreksi Opname Closing");
  });
});
