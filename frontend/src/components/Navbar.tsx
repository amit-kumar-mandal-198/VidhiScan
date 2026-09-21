"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Scale, 
  ScanLine, 
  ShieldAlert, 
  LayoutDashboard, 
  Sparkles,
  ArrowRight
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "Home",
      href: "/",
      icon: Sparkles,
      badge: "Home",
      description: "National Metrology Compliance Grid",
    },
    {
      label: "Citizen scanner",
      href: "/scan",
      icon: ScanLine,
      badge: "Scanner",
      description: "Package verification & price check",
    },
    {
      label: "Inspector squad",
      href: "/inspector",
      icon: ShieldAlert,
      badge: "Inspect",
      description: "Citizen alerts & seizure notices",
    },
    {
      label: "Command HQ",
      href: "/admin",
      icon: LayoutDashboard,
      badge: "Admin",
      description: "Statewide radar & master registry",
    },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-[2.5px] z-40 border-b border-border bg-white/70 backdrop-blur-xl transition-all shadow-xs">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          
          {/* Brand Logo & Gov Subtitle */}
          <Link href="/" className="flex items-center space-x-3 group">
            {/* Dark ink rounded square logo tile */}
            <div className="w-9 h-9 rounded-[10px] bg-ink-900 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <Scale className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-lg md:text-xl tracking-tight text-ink-900">
                  VidhiScan
                </span>
                <span className="inline-flex items-center gap-1 bg-tile-indigo-bg text-tile-indigo-fg text-[11px] font-mono px-2 py-0.5 rounded-chip font-medium">
                  AI v2.4
                </span>
              </div>
              <p className="text-[11px] text-ink-500 font-normal tracking-wide">
                Legal metrology compliance grid • PCR 2011
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 bg-surface-tint/60 p-1 rounded-sidebar border border-border shadow-xs">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-[10px] text-xs transition-all duration-150 ${
                    isActive
                      ? "bg-surface-solid text-ink-900 font-semibold shadow-xs border border-border"
                      : "text-ink-500 hover:text-ink-900 hover:bg-white/40 font-normal"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-ink-900" : "text-ink-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action & Status Indicator */}
          <div className="flex items-center space-x-2.5">
            {/* Primary Action Button (Single Lime) */}
            <Link
              href="/scan"
              className="hidden sm:inline-flex items-center space-x-2 bg-lime-500 hover:bg-lime-600 active:bg-lime-700 text-ink-900 font-semibold px-4 py-2 rounded-control text-xs shadow-xs transition-all active:scale-[0.98]"
            >
              <ScanLine className="w-3.5 h-3.5 text-ink-900" />
              <span>Scan label</span>
              <ArrowRight className="w-3.5 h-3.5 text-ink-900" />
            </Link>

            {/* Grid Sensor Status Pill */}
            <div className="hidden lg:flex items-center space-x-2 bg-surface-solid/80 border border-border px-3 py-1.5 rounded-full text-[11px] font-mono shadow-xs">
              <span className="w-2 h-2 rounded-full bg-lime-600 animate-pulse" />
              <span className="text-ink-500">Grid sensor:</span>
              <span className="text-ink-900 font-semibold">Online</span>
            </div>

            {/* User Avatar */}
            <div 
              className="w-9 h-9 rounded-full bg-avatar-bg text-avatar-fg font-semibold text-xs flex items-center justify-center border border-border shadow-xs select-none"
              title="Legal Metrology Cell Officer"
            >
              LM
            </div>

            {/* Quick Mobile Role Pill */}
            <div className="md:hidden flex items-center space-x-1 bg-surface-tint/60 border border-border p-1 rounded-control text-[11px]">
              {navItems.slice(0, 3).map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-2 py-1 rounded-[8px] transition-all ${
                      isActive
                        ? "bg-ink-900 text-white font-semibold shadow-xs"
                        : "text-ink-500 hover:text-ink-900"
                    }`}
                  >
                    {item.badge}
                  </Link>
                );
              })}
            </div>
          </div>

        </div>
      </header>

      {/* Floating Bottom Navigation Dock for Mobile Devices */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-50">
        <div className="bg-white/85 backdrop-blur-2xl border border-frame-border rounded-sidebar p-1.5 shadow-frame flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-1 flex flex-col items-center py-2 px-1 rounded-control transition-all ${
                  isActive
                    ? "bg-ink-900 text-white font-semibold shadow-xs"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isActive ? "text-white" : "text-ink-400"}`} />
                <span className="text-[10px] tracking-tight">{item.label.split(" ")[0]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
