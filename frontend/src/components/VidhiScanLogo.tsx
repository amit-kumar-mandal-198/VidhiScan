import React from "react";

interface VidhiScanLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  monochrome?: boolean;
}

/**
 * VidhiScan Official Brand Mark: "The 'V' Beam Monogram"
 * 
 * Symbolism:
 * - Left Stem: Solid, grounded pillar of statutory law and legal metrology.
 * - Right Stem: 3 ascending optical laser scan beams representing neural camera inspection.
 * - Center Focal Points: Calibration reticle crosshairs ensuring precision verification.
 */
export default function VidhiScanLogo({
  size = 24,
  className = "",
  monochrome = false,
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
      {/* Left Solid Stem: Rule of Law / Statutory Pillar */}
      <path
        d="M 22 20 L 38 20 L 48 76 L 36 76 Z"
        fill={monochrome ? "currentColor" : "#F8FAFC"}
      />

      {/* Right Scanning Array: Lower Beam (Translucent Emerald) */}
      <path
        d="M 52 76 L 62 44 L 72 44 L 58 76 Z"
        fill={monochrome ? "currentColor" : "#10B981"}
        fillOpacity={monochrome ? 0.6 : 0.65}
      />

      {/* Right Scanning Array: Upper Beam (Vibrant Emerald) */}
      <path
        d="M 64 38 L 74 20 L 84 20 L 72 44 Z"
        fill={monochrome ? "currentColor" : "#10B981"}
      />

      {/* Precision Alignment Sensor Pivot */}
      <circle
        cx="50"
        cy="76"
        r="3.5"
        fill={monochrome ? "currentColor" : "#10B981"}
      />

      {/* Optical Reticle Horizontal Crosshair Ticks */}
      <path
        d="M 14 48 L 24 48"
        stroke={monochrome ? "currentColor" : "#38BDF8"}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M 78 48 L 88 48"
        stroke={monochrome ? "currentColor" : "#38BDF8"}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
