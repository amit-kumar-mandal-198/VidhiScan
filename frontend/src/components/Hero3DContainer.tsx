"use client";

import { useState } from "react";
import OreRing from "@/components/OreRing";
import Hero3DElement from "@/components/Hero3DElement";
import { Sparkles, ShieldCheck, Flame, Layers } from "lucide-react";

export default function Hero3DContainer() {
  const [activeMode, setActiveMode] = useState<"oreRing" | "inspector">("oreRing");

  return (
    <div className="relative w-full h-full flex flex-col items-center">
      {/* Mode Switcher Floating Pill */}
      <div className="z-30 mb-3 flex items-center bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 p-1 rounded-full shadow-lg">
        <button
          type="button"
          onClick={() => setActiveMode("oreRing")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
            activeMode === "oreRing"
              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>3D Ore Ring</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode("inspector")}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium transition-all ${
            activeMode === "inspector"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm font-semibold"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Inspector Tablet</span>
        </button>
      </div>

      {/* 3D Visual Display Box */}
      <div className="relative w-full flex-1 flex items-center justify-center min-h-[380px] sm:min-h-[420px] md:min-h-[460px]">
        {activeMode === "oreRing" ? (
          <div className="w-full h-full animate-in fade-in zoom-in-95 duration-300">
            <OreRing
              className="w-full h-[380px] sm:h-[420px] md:h-[460px]"
              options={{ cycle: 6.5, glow: 1.0, pointer: 0.35 }}
            />
          </div>
        ) : (
          <div className="w-full h-full animate-in fade-in zoom-in-95 duration-300 flex items-center justify-center">
            <Hero3DElement />
          </div>
        )}
      </div>
    </div>
  );
}
