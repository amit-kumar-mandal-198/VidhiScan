"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Scale, 
  ScanLine, 
  ShieldAlert, 
  LayoutDashboard, 
  Sparkles, 
  ArrowRight, 
  Award, 
  Building2,
  ChevronDown,
  Layers,
  X
} from "lucide-react";
import VidhiScanLogo from "./VidhiScanLogo";

export default function Navbar() {
  const pathname = usePathname();
  const [portalsOpen, setPortalsOpen] = useState(false);
  const [mobilePortalsOpen, setMobilePortalsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setPortalsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setPortalsOpen(false);
    setMobilePortalsOpen(false);
  }, [pathname]);

  const publicNavItems = [
    {
      label: "Home",
      href: "/",
      icon: Sparkles,
      badge: "Home",
    },
    {
      label: "Citizen scanner",
      href: "/scan",
      icon: ScanLine,
      badge: "Scanner",
    },
    {
      label: "Brand Trust",
      href: "/companies",
      icon: Award,
      badge: "Trust",
    },
  ];

  const officialPortals = [
    {
      label: "Inspector squad",
      href: "/inspector",
      icon: ShieldAlert,
      role: "Field Enforcement",
      description: "Live citizen alerts, raid execution & seizure notices",
      tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      label: "Manufacturer console",
      href: "/manufacturer",
      icon: Building2,
      role: "Industry Compliance",
      description: "SKU registry, CAD digital twins & pre-flight audits",
      tagColor: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      label: "Command HQ",
      href: "/admin",
      icon: LayoutDashboard,
      role: "State Regulator",
      description: "Statewide radar, master registry & Section 15 warrants",
      tagColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
  ];

  const isPortalActive = officialPortals.some((p) => pathname === p.href);

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-[2.5px] z-40 border-b border-border bg-white/75 backdrop-blur-xl transition-all shadow-xs">
        <div className="container mx-auto px-4 max-w-6xl h-16 flex items-center justify-between">
          
          {/* Brand Logo & Gov Subtitle */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-[10px] bg-ink-900 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
              <VidhiScanLogo size={22} className="w-5.5 h-5.5" />
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
            {publicNavItems.map((item) => {
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

            {/* Official Portals Dropdown Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setPortalsOpen(!portalsOpen)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-[10px] text-xs transition-all duration-150 ${
                  isPortalActive
                    ? "bg-surface-solid text-ink-900 font-semibold shadow-xs border border-border"
                    : portalsOpen
                    ? "bg-white/60 text-ink-900 font-medium"
                    : "text-ink-500 hover:text-ink-900 hover:bg-white/40 font-normal"
                }`}
              >
                <Layers className={`w-3.5 h-3.5 ${isPortalActive ? "text-tile-indigo-fg" : "text-ink-400"}`} />
                <span>Official portals</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${portalsOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {portalsOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-xl border border-border rounded-card p-2 shadow-card z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-500 font-semibold border-b border-border/60">
                    Stakeholder Workspaces
                  </div>
                  {officialPortals.map((portal) => {
                    const Icon = portal.icon;
                    const isActive = pathname === portal.href;
                    return (
                      <Link
                        key={portal.href}
                        href={portal.href}
                        className={`p-2 rounded-control flex items-start space-x-2.5 transition-colors ${
                          isActive
                            ? "bg-surface-tint border border-border/80"
                            : "hover:bg-surface-tint/60"
                        }`}
                      >
                        <div className="p-1.5 rounded-md bg-surface-solid border border-border shrink-0 mt-0.5">
                          <Icon className="w-3.5 h-3.5 text-ink-700" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-semibold text-ink-900">{portal.label}</span>
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${portal.tagColor}`}>
                              {portal.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-ink-500 leading-snug line-clamp-2">
                            {portal.description}
                          </p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action & Status Indicator */}
          <div className="flex items-center space-x-2.5">
            {/* Primary Action Button */}
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
              <span className="text-ink-500">Sensor:</span>
              <span className="text-ink-900 font-semibold">Live</span>
            </div>

            {/* Quick Portals Pill on Mobile Header */}
            <button
              type="button"
              onClick={() => setMobilePortalsOpen(!mobilePortalsOpen)}
              className="md:hidden flex items-center space-x-1.5 bg-surface-tint border border-border px-2.5 py-1.5 rounded-control text-xs font-medium text-ink-700 shadow-xs"
            >
              <Layers className="w-3.5 h-3.5 text-ink-900" />
              <span>Portals</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Portals Modal Drawer */}
      {mobilePortalsOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-canvas border border-border p-4 shadow-card space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2.5">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-tile-indigo-fg" />
                <h3 className="font-semibold text-xs font-mono text-ink-900 uppercase">Official Portals</h3>
              </div>
              <button
                onClick={() => setMobilePortalsOpen(false)}
                className="p-1 rounded-control text-ink-400 hover:text-ink-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {officialPortals.map((portal) => {
                const Icon = portal.icon;
                const isActive = pathname === portal.href;
                return (
                  <Link
                    key={portal.href}
                    href={portal.href}
                    className={`p-3 rounded-control border flex items-start space-x-3 transition-colors ${
                      isActive
                        ? "bg-surface-tint border-ink-900"
                        : "bg-surface-solid border-border hover:border-ink-400"
                    }`}
                  >
                    <div className="p-2 rounded-md bg-white border border-border shrink-0">
                      <Icon className="w-4 h-4 text-ink-900" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-ink-900">{portal.label}</span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${portal.tagColor}`}>
                          {portal.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-ink-500 leading-snug">{portal.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Clean Floating Bottom Navigation Dock for Mobile Devices (4 items) */}
      <div className="md:hidden fixed bottom-3 inset-x-3 z-40">
        <div className="bg-white/90 backdrop-blur-2xl border border-frame-border rounded-sidebar p-1.5 shadow-frame flex items-center justify-around">
          <Link
            href="/"
            className={`flex-1 flex flex-col items-center py-2 px-1 rounded-control transition-all ${
              pathname === "/"
                ? "bg-ink-900 text-white font-semibold shadow-xs"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <Sparkles className={`w-4 h-4 mb-1 ${pathname === "/" ? "text-white" : "text-ink-400"}`} />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          <Link
            href="/scan"
            className={`flex-1 flex flex-col items-center py-2 px-1 rounded-control transition-all ${
              pathname === "/scan"
                ? "bg-lime-500 text-ink-900 font-bold shadow-xs"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <ScanLine className={`w-4 h-4 mb-1 ${pathname === "/scan" ? "text-ink-900 font-bold" : "text-ink-400"}`} />
            <span className="text-[10px] tracking-tight">Scanner</span>
          </Link>

          <Link
            href="/companies"
            className={`flex-1 flex flex-col items-center py-2 px-1 rounded-control transition-all ${
              pathname === "/companies"
                ? "bg-ink-900 text-white font-semibold shadow-xs"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <Award className={`w-4 h-4 mb-1 ${pathname === "/companies" ? "text-white" : "text-ink-400"}`} />
            <span className="text-[10px] tracking-tight">Brands</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobilePortalsOpen(true)}
            className={`flex-1 flex flex-col items-center py-2 px-1 rounded-control transition-all ${
              isPortalActive
                ? "bg-ink-900 text-white font-semibold shadow-xs"
                : "text-ink-500 hover:text-ink-900"
            }`}
          >
            <Layers className={`w-4 h-4 mb-1 ${isPortalActive ? "text-white" : "text-ink-400"}`} />
            <span className="text-[10px] tracking-tight">Portals</span>
          </button>
        </div>
      </div>
    </>
  );
}

