import React, { useId } from "react";

/**
 * Vector mark for the header — transparent, scales cleanly, matches the app palette.
 */
export default function BrandMark({ className = "" }) {
  const uid = useId().replace(/:/g, "");
  const grad = `brand-needle-${uid}`;

  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      width="40"
      height="40"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={grad} x1="10" y1="6" x2="30" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#E8D5B5" />
          <stop offset="0.55" stopColor="#C6A664" />
          <stop offset="1" stopColor="#6FB3B9" />
        </linearGradient>
      </defs>
      {/* Outer ring — light line, no fill box */}
      <circle cx="20" cy="20" r="18" fill="none" stroke="rgba(198, 166, 100, 0.45)" strokeWidth="1.15" />
      {/* Compass */}
      <path d="M20 9 L24 20 L20 31 L16 20 Z" fill={`url(#${grad})`} opacity="0.98" />
      <path d="M20 12 L22.5 20 L20 28 L17.5 20 Z" fill="#061018" opacity="0.88" />
      {/* Hub */}
      <circle cx="20" cy="20" r="2.4" fill="#0a1a28" stroke="rgba(111, 179, 185, 0.55)" strokeWidth="0.6" />
      {/* Horizon / path */}
      <path
        d="M7 29.5 Q20 25.5 33 29.5"
        fill="none"
        stroke="rgba(255, 159, 92, 0.55)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
