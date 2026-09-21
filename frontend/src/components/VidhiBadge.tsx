"use client";

import React from "react";
import { Award, ShieldCheck, AlertTriangle, ShieldAlert, Sparkles, Shield, CheckCircle2 } from "lucide-react";

export interface VidhiBadgeProps {
  score: number;
  tierName?: string;
  badgeCode?: string;
  badgeColor?: string;
  size?: "sm" | "md" | "lg";
  showScore?: boolean;
  showIcon?: boolean;
  isBlacklisted?: boolean;
  className?: string;
}

export function getBadgeConfig(score: number, badgeCode?: string, tierName?: string) {
  if (badgeCode === "diamond" || score >= 900) {
    return {
      name: tierName || "Vidhi Ratna (Diamond)",
      code: "diamond",
      color: "#10B981", // Emerald
      bgLight: "bg-emerald-50 border-emerald-300 text-emerald-900",
      accentBg: "bg-emerald-500 text-white",
      borderRing: "ring-emerald-400",
      icon: Sparkles,
      label: "Diamond Elite",
      statusText: "Exemplary Compliance"
    };
  }
  if (badgeCode === "gold" || score >= 750) {
    return {
      name: tierName || "Vidhi Shrestha (Gold)",
      code: "gold",
      color: "#F59E0B", // Amber
      bgLight: "bg-amber-50 border-amber-300 text-amber-900",
      accentBg: "bg-amber-500 text-white",
      borderRing: "ring-amber-400",
      icon: Award,
      label: "Gold Tier",
      statusText: "High Trust Accreditation"
    };
  }
  if (badgeCode === "silver" || score >= 600) {
    return {
      name: tierName || "Vidhi Mitra (Silver)",
      code: "silver",
      color: "#64748B", // Slate
      bgLight: "bg-slate-100 border-slate-300 text-slate-900",
      accentBg: "bg-slate-600 text-white",
      borderRing: "ring-slate-400",
      icon: ShieldCheck,
      label: "Silver Standard",
      statusText: "Baseline Compliant"
    };
  }
  if (badgeCode === "bronze" || score >= 450) {
    return {
      name: tierName || "Vidhi Chetna (Bronze)",
      code: "bronze",
      color: "#EA580C", // Orange
      bgLight: "bg-orange-50 border-orange-300 text-orange-900",
      accentBg: "bg-orange-500 text-white",
      borderRing: "ring-orange-400",
      icon: AlertTriangle,
      label: "Bronze Watchlist",
      statusText: "Under Regulatory Notice"
    };
  }
  return {
    name: tierName || "Defaulter (Red Flag)",
    code: "defaulter",
    color: "#EF4444", // Red
    bgLight: "bg-red-50 border-red-300 text-red-900",
    accentBg: "bg-red-600 text-white",
    borderRing: "ring-red-400",
    icon: ShieldAlert,
    label: "Defaulter",
    statusText: "Trust Revoked • Raid Target"
  };
}

export default function VidhiBadge({
  score,
  tierName,
  badgeCode,
  badgeColor,
  size = "md",
  showScore = true,
  showIcon = true,
  isBlacklisted = false,
  className = "",
}: VidhiBadgeProps) {
  const cfg = getBadgeConfig(score, badgeCode, tierName);
  const Icon = cfg.icon;

  if (size === "sm") {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold tracking-tight shadow-2xs ${cfg.bgLight} ${className}`}
        title={`${cfg.name} (Score: ${score}/1000)`}
      >
        {showIcon && <Icon className="w-3 h-3 shrink-0" />}
        <span>{cfg.label}</span>
        {showScore && <span className="font-mono opacity-80">({score})</span>}
      </span>
    );
  }

  if (size === "lg") {
    return (
      <div className={`p-4 rounded-xl border flex items-center justify-between shadow-xs ${cfg.bgLight} ${className}`}>
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center shadow-xs ${cfg.accentBg}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm tracking-tight">{cfg.name}</h4>
              {isBlacklisted && (
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  Blacklisted
                </span>
              )}
            </div>
            <p className="text-xs opacity-75">{cfg.statusText}</p>
          </div>
        </div>

        {showScore && (
          <div className="text-right">
            <div className="text-2xl font-black font-mono tracking-tight">{score}</div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">VidhiScore™</div>
          </div>
        )}
      </div>
    );
  }

  // Medium (default)
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-2xs ${cfg.bgLight} ${className}`}
      title={`${cfg.name} • VidhiScore: ${score}/1000`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      <span>{cfg.label}</span>
      {showScore && (
        <span className="font-mono bg-white/70 px-1.5 py-0.2 rounded-full text-[10px] font-bold border border-black/5">
          {score}
        </span>
      )}
    </span>
  );
}
