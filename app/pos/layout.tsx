import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "POS Kasir — Rumah NF3",
  description: "Point of Sale tablet kasir Nusa Food Group.",
  manifest: "/manifest-pos.json",
  appleWebApp: {
    capable: true,
    title: "POS NF3",
    statusBarStyle: "default"
  }
};

export const viewport: Viewport = {
  themeColor: "#1e293b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false
};

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
