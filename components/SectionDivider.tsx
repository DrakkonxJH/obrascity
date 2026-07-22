"use client";

import { useId } from "react";

interface SectionDividerProps {
  from?: string;
  to?: string;
  flip?: boolean;
  className?: string;
}

export default function SectionDivider({
  from = "#0e0d0b",
  to = "#ece5d8",
  flip = false,
  className = "",
}: SectionDividerProps) {
  // Use unique ID to prevent SVG gradient conflicts
  const id = useId();
  const gradientId = `divider-grad-${id}`;

  return (
    <div
      className={`relative w-full overflow-hidden pointer-events-none ${className}`}
      style={{ marginTop: "-1px", marginBottom: "-1px" }}
    >
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        className={`w-full h-20 md:h-28 block ${flip ? "rotate-180" : ""}`}
        fill="none"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        {/* Smooth wave curve */}
        <path
          d="M0,0 L0,50 Q360,110 720,70 T1440,90 L1440,0 Z"
          fill={from}
        />
        <path
          d="M0,50 Q360,110 720,70 T1440,90 L1440,120 L0,120 Z"
          fill={to}
        />
        {/* Subtle line accent */}
        <path
          d="M0,50 Q360,110 720,70 T1440,90"
          stroke="#c9a96e"
          strokeWidth="0.5"
          strokeOpacity="0.25"
          fill="none"
        />
      </svg>
    </div>
  );
}
