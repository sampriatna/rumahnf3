"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Poll server setiap 12 detik — cukup untuk KDS in-memory tanpa WebSocket. */
export function KdsAutoRefresh({ seconds = 12 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return null;
}
