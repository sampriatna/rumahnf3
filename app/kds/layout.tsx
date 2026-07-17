import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "KDS — Rumah NF3",
  description: "Kitchen Display System dapur & bar.",
  manifest: "/manifest-kds.json",
  appleWebApp: {
    capable: true,
    title: "KDS NF3",
    statusBarStyle: "black-translucent"
  }
};

export const viewport: Viewport = {
  themeColor: "#be123c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function KdsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="kds-shell h-dvh overflow-hidden [color-scheme:dark]">
      {children}
    </div>
  );
}
