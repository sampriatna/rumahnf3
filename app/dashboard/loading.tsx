import { Suspense } from "react";
import { OwnerSummarySection } from "./OwnerSummarySection";
import { OwnerSummaryFallback } from "./OwnerSummaryFallback";

export default function DashboardLoading() {
  return <OwnerSummaryFallback />;
}
