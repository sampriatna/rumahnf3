import { describe, expect, it } from "vitest";
import {
  labelFor,
  orderStatusLabel,
  paymentStatusLabel,
  productionStatusLabel
} from "./ui-labels";

describe("ui-labels", () => {
  it("orderStatusLabel memakai istilah Indonesia", () => {
    expect(orderStatusLabel.open).toBe("Menunggu");
    expect(orderStatusLabel.held).toBe("Simpan Draft");
    expect(orderStatusLabel.completed).toBe("Selesai");
  });

  it("paymentStatusLabel memisahkan status bayar", () => {
    expect(paymentStatusLabel.unpaid).toBe("Belum Dibayar");
    expect(paymentStatusLabel.paid).toBe("Lunas");
  });

  it("productionStatusLabel untuk dapur", () => {
    expect(productionStatusLabel.cooking).toBe("Sedang Dibuat");
    expect(productionStatusLabel.ready).toBe("Siap");
  });

  it("labelFor fallback aman", () => {
    expect(labelFor(orderStatusLabel, "open")).toBe("Menunggu");
    expect(labelFor(orderStatusLabel, "unknown", "—")).toBe("—");
    expect(labelFor(paymentStatusLabel, null)).toBe("—");
  });
});
