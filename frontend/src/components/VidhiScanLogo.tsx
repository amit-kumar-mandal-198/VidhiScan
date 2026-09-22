import React from "react";

interface VidhiScanLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * VidhiScan Official Government Emblem: "The Rashtriya Metrology Mudra"
 * 
 * Authentic statutory authority seal of the Legal Metrology Compliance Grid:
 * - Sovereign Medallion: Deep Ashoka Navy (#0B1B3D) with 24 calibration ticks.
 * - Central Scales: Classical brass/gold (#F59E0B) balanced scales of justice.
 * - Optical Metrology: Digital emerald laser scan reticle at fulcrum pivot.
 */
export default function VidhiScanLogo({
  size = 28,
  className = "",
  ...props
}: VidhiScanLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer Deep Ashoka Navy Medallion */}
      <circle cx="50" cy="50" r="47" fill="#0B1B3D" stroke="#1E293B" strokeWidth="1.5" />
      
      {/* Tricolor Ambient Rings (Gold / Saffron & Emerald) */}
      <circle cx="50" cy="50" r="42" stroke="#F59E0B" strokeWidth="1.5" strokeDasharray="8 4" />
      <circle cx="50" cy="50" r="38" stroke="#10B981" strokeWidth="1" />

      {/* 24 Calibrated Sovereign Spokes */}
      <g stroke="#38BDF8" strokeWidth="1.5" opacity="0.45">
        <line x1="50" y1="9" x2="50" y2="13" />
        <line x1="50" y1="87" x2="50" y2="91" />
        <line x1="9" y1="50" x2="13" y2="50" />
        <line x1="87" y1="50" x2="91" y2="50" />
        <line x1="21" y1="21" x2="24" y2="24" />
        <line x1="76" y1="76" x2="79" y2="79" />
        <line x1="21" y1="79" x2="24" y2="76" />
        <line x1="76" y1="24" x2="79" y2="21" />
      </g>

      {/* Central Golden Scale of Justice (Gold/Brass #F59E0B) */}
      {/* Pillar Base Pedestal */}
      <path d="M 40 76 L 60 76 L 56 71 L 44 71 Z" fill="#F59E0B" />
      <rect x="48" y="27" width="4" height="44" fill="#F59E0B" />
      
      {/* Fulcrum Top Ring */}
      <circle cx="50" cy="25" r="4" fill="#F59E0B" />
      <circle cx="50" cy="25" r="2" fill="#0B1B3D" />

      {/* Horizontal Balance Beam */}
      <rect x="23" y="32" width="54" height="3.5" rx="1.75" fill="#F8FAFC" />

      {/* Left Gold Metric Pan */}
      <line x1="27" y1="35.5" x2="21" y2="52" stroke="#F8FAFC" strokeWidth="1.5" />
      <line x1="27" y1="35.5" x2="33" y2="52" stroke="#F8FAFC" strokeWidth="1.5" />
      <path d="M 17 52 C 17 59, 37 59, 37 52 Z" fill="#F59E0B" />

      {/* Right Gold Metric Pan */}
      <line x1="73" y1="35.5" x2="67" y2="52" stroke="#F8FAFC" strokeWidth="1.5" />
      <line x1="73" y1="35.5" x2="79" y2="52" stroke="#F8FAFC" strokeWidth="1.5" />
      <path d="M 63 52 C 63 59, 83 59, 83 52 Z" fill="#F59E0B" />

      {/* Optical Laser Scan Reticle Dot at Center */}
      <circle cx="50" cy="44" r="3" fill="#10B981" />
      <line x1="42" y1="44" x2="45" y2="44" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="55" y1="44" x2="58" y2="44" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
