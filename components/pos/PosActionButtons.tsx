export function PlaceOrderButton({
  label = "Simpan ke Bill",
  disabled
}: {
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button type="submit" className="pos-cta-primary" disabled={disabled}>
      {label}
    </button>
  );
}

export function PaymentButton({ label = "Bayar" }: { label?: string }) {
  return (
    <button type="submit" className="pos-cta-primary">
      {label}
    </button>
  );
}

export function DraftButton({ label = "Hold" }: { label?: string }) {
  return (
    <button type="submit" className="btn-secondary px-3 py-1.5 text-xs">
      {label}
    </button>
  );
}
