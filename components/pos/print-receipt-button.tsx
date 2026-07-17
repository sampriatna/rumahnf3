"use client";

export function PrintReceiptButton({ label = "Cetak Struk" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn-primary w-full py-3 text-sm print:hidden"
    >
      {label}
    </button>
  );
}
