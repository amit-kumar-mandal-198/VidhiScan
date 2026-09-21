"use client";

import { useEffect, useRef } from "react";
import { mountOreRing, OreRingInstance, OreRingOptions } from "@/lib/ore-ring";

interface OreRingProps {
  className?: string;
  options?: OreRingOptions;
}

export default function OreRing({ className = "", options }: OreRingProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<OreRingInstance | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ring = mountOreRing(el, {
      ...options,
    });

    if (!ring) return;
    ringRef.current = ring;

    return () => {
      ring.dispose();
      ringRef.current = null;
    };
  }, []);

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center select-none ${className}`}
    >
      {/* Background Soft Atmosphere Glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-72 h-72 sm:w-88 sm:h-88 rounded-full blur-[80px] bg-orange-500/15" />
      </div>

      {/* Pure Three.js Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full flex items-center justify-center relative cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
