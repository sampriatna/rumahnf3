import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { PortalShellGate } from "@/components/shell/PortalShellGate";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: `${APP_NAME} — ${APP_TAGLINE}`,
  description: "Pusat kerja internal Nusa Food Group & Nusa Fishing.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-surface font-sans antialiased text-slate-900`}>
        <PortalShellGate>{children}</PortalShellGate>
      </body>
    </html>
  );
}
