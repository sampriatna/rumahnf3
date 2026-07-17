import Link from "next/link";

export function PrintButton({
  orderId,
  outletId,
  label = "Struk"
}: {
  orderId: string;
  outletId: string;
  label?: string;
}) {
  return (
    <Link
      href={`/pos/receipt/${orderId}?outlet=${outletId}`}
      className="text-xs font-bold text-navy-700 hover:underline"
    >
      {label}
    </Link>
  );
}

export function VoidButton({
  orderId,
  outletId,
  label = "Void"
}: {
  orderId: string;
  outletId: string;
  label?: string;
}) {
  return (
    <Link
      href={`/pos/void/${orderId}?outlet=${outletId}`}
      className="text-xs font-bold text-rose-600 hover:underline"
    >
      {label}
    </Link>
  );
}
