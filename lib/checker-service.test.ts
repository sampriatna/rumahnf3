import { describe, expect, it } from "vitest";
import { listCheckerBoard } from "./checker-service";
import { ensurePosSeeded } from "./pos-service";

describe("listCheckerBoard", () => {
  it("mengembalikan array read-only untuk outlet POS", () => {
    ensurePosSeeded();
    const board = listCheckerBoard("kbu");
    expect(Array.isArray(board)).toBe(true);
  });

  it("setiap entri punya label kesiapan dan item per station", () => {
    ensurePosSeeded();
    const board = listCheckerBoard("kbu");
    for (const row of board) {
      expect(row.orderId).toBeTruthy();
      expect(row.readinessLabel).toBeTruthy();
      expect(Array.isArray(row.stations)).toBe(true);
      expect(Array.isArray(row.items)).toBe(true);
    }
  });
});
