"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function PosConnectivityBadge() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  return online ? (
    <>
      <Wifi className="h-3 w-3 text-emerald-500" aria-hidden />
      <span className="text-emerald-700">Online</span>
    </>
  ) : (
    <>
      <WifiOff className="h-3 w-3 text-rose-500" aria-hidden />
      <span className="text-rose-700">Offline</span>
    </>
  );
}
