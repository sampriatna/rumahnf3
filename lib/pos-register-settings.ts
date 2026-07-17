/** Mode cetak struk di tablet/browser kasir. */
export type ReceiptPrinterMode = "browser" | "none";

export type PosRegisterSettings = {
  receiptPrinterMode: ReceiptPrinterMode;
  /** Nama printer di OS / jaringan (referensi kasir). */
  printerName?: string;
  /** IP atau host printer thermal (untuk bridge ESC/POS nanti). */
  printerHost?: string;
  paperWidthMm: 58 | 80;
  receiptCopies: 1 | 2;
  autoPrintReceipt: boolean;
  autoPrintKitchen: boolean;
  /** Buka laci saat bayar cash — butuh bridge lokal / ESC-POS. */
  openDrawerOnCash: boolean;
  receiptHeader?: string;
  receiptFooter?: string;
  /** Modal awal default saat buka shift. */
  defaultOpeningFloat: number;
  /** Tampilkan panel Quick Cash di checkout. */
  showQuickCash: boolean;
};

export const DEFAULT_REGISTER_SETTINGS: PosRegisterSettings = {
  receiptPrinterMode: "browser",
  paperWidthMm: 80,
  receiptCopies: 1,
  autoPrintReceipt: true,
  autoPrintKitchen: false,
  openDrawerOnCash: false,
  receiptHeader: undefined,
  receiptFooter: "Terima kasih · Sampai jumpa lagi",
  defaultOpeningFloat: 500_000,
  showQuickCash: true
};

export function normalizeRegisterSettings(
  partial?: Partial<PosRegisterSettings>
): PosRegisterSettings {
  return {
    ...DEFAULT_REGISTER_SETTINGS,
    ...partial,
    receiptPrinterMode: partial?.receiptPrinterMode ?? DEFAULT_REGISTER_SETTINGS.receiptPrinterMode,
    paperWidthMm: partial?.paperWidthMm === 58 ? 58 : 80,
    receiptCopies: partial?.receiptCopies === 2 ? 2 : 1,
    defaultOpeningFloat: Math.max(0, partial?.defaultOpeningFloat ?? DEFAULT_REGISTER_SETTINGS.defaultOpeningFloat)
  };
}
