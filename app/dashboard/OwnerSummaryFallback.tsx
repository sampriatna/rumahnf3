import { LoadingState } from "@/components/ui/LoadingState";

export function OwnerSummaryFallback() {
  return (
    <LoadingState
      className="mb-10"
      title="Memuat ringkasan…"
      description="Finance, stok, dan approval."
    />
  );
}
