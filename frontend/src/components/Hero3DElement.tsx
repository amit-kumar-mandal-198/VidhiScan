"use client";

import { useRef, useState, useEffect } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Scan,
  Zap,
  Sparkles,
  Barcode,
  Scale,
  Crosshair,
  Layers,
} from "lucide-react";

interface Scenario {
  id: string;
  name: string;
  category: string;
  badge: string;
  status: "clean" | "violation" | "warning";
  brand: string;
  productName: string;
  netQty: string;
  declaredPrice: string;
  unitPrice: string;
  barcode: string;
  mfgDate: string;
  ocrConfidence: string;
  infractionDetail?: string;
  ruleTags: {
    rule: string;
    label: string;
    status: "pass" | "fail";
    value: string;
  }[];
}

const SCENARIOS: Scenario[] = [
  {
    id: "amul",
    name: "Amul Butter",
    category: "Dairy & Fats",
    badge: "100% Compliant",
    status: "clean",
    brand: "AMUL",
    productName: "Pasteurised Butter 100g",
    netQty: "100 g",
    declaredPrice: "₹56.00",
    unitPrice: "₹0.56 / g",
    barcode: "8901262010053",
    mfgDate: "12/2025",
    ocrConfidence: "99.8%",
    ruleTags: [
      { rule: "Rule 6(1)(c)", label: "Net Weight", status: "pass", value: "100g (±0.0g)" },
      { rule: "Rule 6(1)(h)", label: "Max Retail Price", status: "pass", value: "₹56.00 (Incl. Taxes)" },
      { rule: "Rule 6(1)(h)", label: "Unit Sale Price", status: "pass", value: "₹0.56/g" },
      { rule: "Rule 6(1)(d)", label: "Packing Date", status: "pass", value: "Dec 2025" },
    ],
  },
  {
    id: "surf",
    name: "Surf Excel 1kg",
    category: "Fabric Care",
    badge: "Dual-MRP Fraud",
    status: "violation",
    brand: "SURF EXCEL",
    productName: "Easy Wash Detergent 1kg",
    netQty: "1 kg",
    declaredPrice: "₹190.00 (Sticker)",
    unitPrice: "₹0.19 / g",
    barcode: "8901030383792",
    mfgDate: "01/2026",
    ocrConfidence: "98.9%",
    infractionDetail: "Secondary sticker (+₹50) pasted over printed MRP ₹140.00",
    ruleTags: [
      { rule: "Rule 6(1)(c)", label: "Net Weight", status: "pass", value: "1.00 kg" },
      { rule: "Rule 6(1)(h)", label: "Dual-MRP Alteration", status: "fail", value: "+₹50 Overcharge Caught" },
      { rule: "Section 36(2)", label: "Statutory Breach", status: "fail", value: "Sticker Alteration Offence" },
      { rule: "Rule 6(1)(d)", label: "Batch & Date", status: "pass", value: "Jan 2026" },
    ],
  },
  {
    id: "fortune",
    name: "Fortune Oil 1L",
    category: "Edible Oils",
    badge: "Crown Proviso",
    status: "clean",
    brand: "FORTUNE",
    productName: "Kachi Ghani Mustard Oil 1L",
    netQty: "1 L / 910 g",
    declaredPrice: "₹165.00",
    unitPrice: "₹0.165 / ml",
    barcode: "8906007281452",
    mfgDate: "11/2025",
    ocrConfidence: "99.4%",
    ruleTags: [
      { rule: "Rule 6(1)(c)", label: "Volume & Density", status: "pass", value: "1L (910g at 30°C)" },
      { rule: "Rule 6(1)(d)", label: "Crown Seal Proviso", status: "pass", value: "Neck Stamping Valid" },
      { rule: "Rule 6(1)(h)", label: "Retail Price", status: "pass", value: "₹165.00" },
      { rule: "Rule 6(1)(f)", label: "Origin Country", status: "pass", value: "India" },
    ],
  },
];

/**
 * Hero3DElement — Choice 1: Interactive Forensic Inspector Tablet
 * A floating, 3D-angled glassmorphic tablet with live AI scanning viewfinder,
 * sweeping laser beam, active OCR bounding brackets, and floating holographic compliance chips.
 */
export default function Hero3DElement() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("amul");
  const [rotX, setRotX] = useState<number>(8);
  const [rotY, setRotY] = useState<number>(-12);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);

  const activeScenario = SCENARIOS.find((s) => s.id === activeScenarioId) || SCENARIOS[0];

  // Mouse Parallax Physics
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const normX = (x / rect.width) * 2 - 1; // -1 to 1
    const normY = (y / rect.height) * 2 - 1; // -1 to 1

    // Controlled 3D isometric tilt
    setRotY(normX * 18);
    setRotX(-normY * 14);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Smoothly return to signature beauty angle
    setRotX(8);
    setRotY(-12);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const switchScenario = (id: string) => {
    setActiveScenarioId(id);
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 600);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full flex items-center justify-center select-none"
      style={{ perspective: "1200px" }}
    >
      {/* Background Soft Chromatic Glows */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-64 h-64 sm:w-80 sm:h-80 rounded-full blur-[70px] transition-colors duration-700 ${
            activeScenario.status === "violation"
              ? "bg-rose-500/25"
              : "bg-emerald-400/25"
          }`}
        />
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-52 h-52 sm:w-68 sm:h-68 rounded-full bg-indigo-500/20 blur-[55px]" />
      </div>

      {/* 3D TRANSFORM WRAPPER */}
      <div
        className="relative w-full max-w-[420px] transition-transform duration-200 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {/* ─── MAIN INSPECTOR TABLET CHASSIS ───────────────────────────── */}
        <div
          className="relative rounded-[26px] bg-slate-950/90 border border-slate-700/70 p-2.5 sm:p-3 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.55),0_0_30px_rgba(99,102,241,0.2)] backdrop-blur-xl transition-all duration-300"
          style={{ transform: "translateZ(0px)" }}
        >
          {/* Top Tablet Masthead & Camera Notch */}
          <div className="flex items-center justify-between px-2.5 py-1.5 mb-1.5 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  activeScenario.status === "violation"
                    ? "bg-rose-500 animate-ping"
                    : "bg-emerald-400 animate-pulse"
                }`}
              />
              <span className="font-semibold text-slate-200">
                VIDHISCAN OS v2.4
              </span>
            </div>

            {/* Central Tablet Lens Pill */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9px]">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-slate-400">4K Optical Reticle</span>
            </div>

            <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-bold">
              <Zap className="w-3 h-3" />
              <span>{activeScenario.ocrConfidence} OCR</span>
            </div>
          </div>

          {/* ─── LIVE AI VIEWFINDER SCREEN ─────────────────────────────── */}
          <div
            className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-slate-800 aspect-[4/3] flex flex-col justify-between p-3.5"
            style={{ transform: "translateZ(15px)" }}
          >
            {/* Viewfinder Specular Reflection Sheen */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/[0.04] to-white/0 pointer-events-none z-20" />

            {/* Continuous Sweeping Laser Beam */}
            <div className="absolute inset-x-0 h-1 z-30 pointer-events-none animate-laser-sweep">
              <div
                className={`w-full h-full shadow-[0_0_15px_3px] ${
                  activeScenario.status === "violation"
                    ? "bg-rose-400 shadow-rose-500/80"
                    : "bg-emerald-400 shadow-emerald-500/80"
                }`}
              />
              <div
                className={`w-full h-8 -translate-y-4 opacity-25 bg-gradient-to-b ${
                  activeScenario.status === "violation"
                    ? "from-rose-500/40 to-transparent"
                    : "from-emerald-500/40 to-transparent"
                }`}
              />
            </div>

            {/* Instant Click Audit Flash */}
            {isFlashing && (
              <div className="absolute inset-0 bg-white/20 z-40 animate-out fade-out duration-300 pointer-events-none" />
            )}

            {/* Viewfinder Corner Crosshairs */}
            <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t-2 border-l-2 border-emerald-400/80 z-20" />
            <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t-2 border-r-2 border-emerald-400/80 z-20" />
            <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b-2 border-l-2 border-emerald-400/80 z-20" />
            <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b-2 border-r-2 border-emerald-400/80 z-20" />

            {/* Top Viewfinder Telemetry Bar */}
            <div className="relative z-20 flex items-center justify-between text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700/80 flex items-center gap-1 shadow-sm">
                <Crosshair className="w-3 h-3 text-emerald-400" />
                <span>EAN: {activeScenario.barcode}</span>
              </span>

              <span
                className={`px-2 py-0.5 rounded font-bold border text-[9px] shadow-sm ${
                  activeScenario.status === "violation"
                    ? "bg-rose-950/90 text-rose-300 border-rose-600/80"
                    : "bg-emerald-950/90 text-emerald-300 border-emerald-600/80"
                }`}
              >
                {activeScenario.badge.toUpperCase()}
              </span>
            </div>

            {/* Center: Live Packaged Commodity Graphic & OCR Target Brackets */}
            <div className="relative z-10 my-auto flex items-center justify-center">
              {/* Product Packaging Display Card */}
              <div className="relative w-full max-w-[280px] bg-slate-800/80 rounded-xl p-3 border border-slate-700/90 shadow-inner flex items-center gap-3">
                {/* Brand Visual Tile */}
                <div
                  className={`w-14 h-16 rounded-lg flex flex-col items-center justify-center shrink-0 shadow-md ${
                    activeScenario.id === "amul"
                      ? "bg-gradient-to-b from-amber-400 to-yellow-500 text-slate-950"
                      : activeScenario.id === "surf"
                      ? "bg-gradient-to-b from-indigo-600 to-blue-700 text-white"
                      : "bg-gradient-to-b from-amber-500 to-emerald-600 text-white"
                  }`}
                >
                  <span className="text-[11px] font-black tracking-wider leading-none">
                    {activeScenario.brand}
                  </span>
                  <Scale className="w-4 h-4 mt-1 opacity-80" />
                </div>

                {/* Product Metadata & Active OCR Bounding Boxes */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-bold text-white truncate">
                    {activeScenario.productName}
                  </p>

                  {/* Net Quantity Bounding Box */}
                  <div className="flex items-center justify-between text-[10px] font-mono bg-emerald-500/10 border border-emerald-400/40 px-1.5 py-0.5 rounded">
                    <span className="text-slate-400">Net Qty:</span>
                    <span className="text-emerald-300 font-bold">
                      {activeScenario.netQty}
                    </span>
                  </div>

                  {/* Price Tag Bounding Box */}
                  <div
                    className={`flex items-center justify-between text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      activeScenario.status === "violation"
                        ? "bg-rose-500/15 border-rose-500/70 text-rose-300 animate-pulse"
                        : "bg-indigo-500/10 border-indigo-400/40 text-indigo-200"
                    }`}
                  >
                    <span className="text-slate-400">MRP:</span>
                    <span className="font-bold">{activeScenario.declaredPrice}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Viewfinder Rule Banner */}
            <div className="relative z-20">
              {activeScenario.status === "violation" ? (
                <div className="bg-rose-950/90 border border-rose-500/80 text-rose-200 text-[10px] font-mono px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate">{activeScenario.infractionDetail}</span>
                </div>
              ) : (
                <div className="bg-emerald-950/80 border border-emerald-500/70 text-emerald-200 text-[10px] font-mono px-2.5 py-1.5 rounded-lg flex items-center justify-between shadow-md">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Rule 6(1) Verified Clean</span>
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold">
                    8/8 PASS
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ─── BOTTOM INTERACTIVE PRESET SWITCHER ───────────────────────── */}
          <div className="mt-2.5 flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
              Audit Scenarios:
            </span>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
              {SCENARIOS.map((scenario) => {
                const isActive = scenario.id === activeScenarioId;
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => switchScenario(scenario.id)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-medium transition-all ${
                      isActive
                        ? scenario.status === "violation"
                          ? "bg-rose-600 text-white shadow-xs font-bold"
                          : "bg-emerald-600 text-white shadow-xs font-bold"
                        : "bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60"
                    }`}
                  >
                    {scenario.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── FLOATING HOLOGRAPHIC PARALLAX CHIPS ──────────────────────── */}

        {/* CHIP 1: Top-Right Rule 6(1)(c) Net Weight Card (Elevated at Z=65px) */}
        <div
          className="absolute -top-6 -right-6 hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 px-3 py-2 rounded-xl shadow-xl transition-transform duration-300 pointer-events-none"
          style={{
            transform: `translateZ(65px) translate3d(${rotY * -0.6}px, ${rotX * -0.5}px, 0)`,
          }}
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="font-mono text-[10px] leading-tight">
            <p className="text-slate-400">Rule 6(1)(c) Net Qty</p>
            <p className="font-bold text-white flex items-center gap-1">
              <span>{activeScenario.netQty}</span>
              <span className="text-[8px] bg-emerald-950 text-emerald-400 px-1 py-0.2 rounded border border-emerald-500/30">
                100% MATCH
              </span>
            </p>
          </div>
        </div>

        {/* CHIP 2: Bottom-Left Rule 6(1)(h) Unit Sale Price Card (Elevated at Z=80px) */}
        <div
          className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-2 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 px-3 py-2 rounded-xl shadow-xl transition-transform duration-300 pointer-events-none"
          style={{
            transform: `translateZ(80px) translate3d(${rotY * 0.7}px, ${rotX * 0.5}px, 0)`,
          }}
        >
          <div
            className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
              activeScenario.status === "violation"
                ? "bg-rose-500/20 border-rose-400/40 text-rose-400"
                : "bg-indigo-500/20 border-indigo-400/40 text-indigo-400"
            }`}
          >
            {activeScenario.status === "violation" ? (
              <AlertTriangle className="w-4 h-4" />
            ) : (
              <Barcode className="w-4 h-4" />
            )}
          </div>
          <div className="font-mono text-[10px] leading-tight">
            <p className="text-slate-400">
              {activeScenario.status === "violation"
                ? "Sec 36(2) Sticker Alteration"
                : "Rule 6(1)(h) Unit Price"}
            </p>
            <p
              className={`font-bold ${
                activeScenario.status === "violation"
                  ? "text-rose-400"
                  : "text-white"
              }`}
            >
              {activeScenario.status === "violation"
                ? "₹50 ILLEGAL MARKUP"
                : activeScenario.unitPrice}
            </p>
          </div>
        </div>

        {/* CHIP 3: Top-Left Sensor Telemetry Pill (Elevated at Z=45px) */}
        <div
          className="absolute -top-3 left-6 hidden md:flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-2.5 py-1 rounded-full text-[9px] font-mono text-slate-400 shadow-md pointer-events-none"
          style={{
            transform: `translateZ(45px) translate3d(${rotY * 0.3}px, ${rotX * -0.3}px, 0)`,
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>FPS: 60 · Latency: 14ms</span>
        </div>
      </div>
    </div>
  );
}
