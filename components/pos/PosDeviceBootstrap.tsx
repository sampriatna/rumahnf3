"use client";

import { useEffect } from "react";
import { POS_DEVICE_COOKIE } from "@/lib/pos-device-constants";

export function PosDeviceBootstrap() {
  useEffect(() => {
    const hasCookie = document.cookie
      .split(";")
      .some((part) => part.trim().startsWith(`${POS_DEVICE_COOKIE}=`));
    if (hasCookie) return;

    const id = crypto.randomUUID();
    document.cookie = `${POS_DEVICE_COOKIE}=${id}; path=/; max-age=31536000; SameSite=Lax`;
  }, []);

  return null;
}
