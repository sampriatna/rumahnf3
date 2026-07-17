import type { TransferStatus } from "@/lib/transfer";
import { transferStatusLabel, transferStatusTone } from "@/lib/inventory-ui";
import { OpStatusBadge } from "@/components/ui/OpStatusBadge";

export function TransferStatusBadge({ status }: { status: TransferStatus }) {
  return (
    <OpStatusBadge tone={transferStatusTone(status)}>{transferStatusLabel(status)}</OpStatusBadge>
  );
}
