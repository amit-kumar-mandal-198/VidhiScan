import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

import Navbar from "@/components/Navbar";
import PwaRegister from "@/components/PwaRegister";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#10B981",
};

export const metadata: Metadata = {
  title: "VidhiScan | Legal Metrology AI Compliance Grid",
  description: "AI-Powered Statutory Compliance Verification of Packaged Commodities under Legal Metrology (Packaged Commodities) Rules, 2011",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VidhiScan",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${inter.className} min-h-screen flex flex-col antialiased selection:bg-lime-500 selection:text-ink-900 text-ink-900 relative`}>
        <PwaRegister />
        {/* Statutory Compliance Ambient Ribbon */}
        <div className="h-[2.5px] bg-gradient-to-r from-amber-500 via-white to-emerald-600 opacity-90 sticky top-0 z-50" />

        {/* Navigation */}
        <Navbar />

        {/* Main Content Viewport */}
        <main className="flex-1 w-full flex flex-col py-4 md:py-6">
          {children}
        </main>

        {/* Translucent Frosted Footer */}
        <footer className="border-t border-border bg-white/45 backdrop-blur-md py-6 text-ink-500 text-xs mt-auto pb-20 md:pb-6">
          <div className="container mx-auto px-4 max-w-6xl flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
            <div>
              <p className="font-semibold text-ink-900 flex items-center justify-center sm:justify-start gap-2 text-xs">
                <span>VidhiScan AI — National Legal Metrology Compliance Grid</span>
                <span className="text-[10px] bg-tile-mint-bg text-tile-mint-fg border border-tile-mint-fg/20 px-2 py-0.5 rounded-full font-mono font-medium">
                  Official Portal
                </span>
              </p>
              <p className="text-[11px] text-ink-500 mt-1">
                Enforcing Legal Metrology (Packaged Commodities) Rules, 2011 • Department of Consumer Affairs
              </p>
            </div>
            
            <div className="flex items-center space-x-3 text-[11px] font-mono">
              <span className="bg-surface-solid/80 px-3 py-1 rounded-full border border-border text-ink-900 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-600 animate-pulse" />
                <span className="font-semibold">Active Node</span>
              </span>
              <span className="text-ink-500">Government of India</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
