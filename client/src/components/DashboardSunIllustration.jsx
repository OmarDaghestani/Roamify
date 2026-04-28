import { useId } from "react";

/** Vector sun for sunlit dashboard; colors from CSS vars on `.dashboard-atmosphere__day`. */
export default function DashboardSunIllustration() {
  const uid = useId().replace(/:/g, "");
  const id = (s) => `ds-${s}-${uid}`;

  return (
    <svg
      className="dashboard-sun-svg"
      viewBox="0 0 240 240"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id={id("core")} cx="32%" cy="28%" r="55%">
          <stop offset="0%" stopColor="var(--dash-sun-hot, #fffef8)" />
          <stop offset="35%" stopColor="var(--dash-sun-face, #fffbeb)" />
          <stop offset="62%" stopColor="var(--dash-sun-amber, #fcd34d)" />
          <stop offset="88%" stopColor="var(--dash-sun-edge, #f59e0b)" stopOpacity="0.65" />
          <stop offset="100%" stopColor="var(--dash-sun-edge, #f59e0b)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("glow-a")} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--dash-sun-corona-inner, #fffef0)" stopOpacity="0.55" />
          <stop offset="45%" stopColor="var(--dash-sun-corona-mid, #fef3c7)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--dash-sun-corona-outer, #fde68a)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id("glow-b")} cx="42%" cy="38%" r="50%">
          <stop offset="0%" stopColor="var(--dash-sun-halo, #fef9c3)" stopOpacity="0.35" />
          <stop offset="70%" stopColor="var(--dash-sun-halo-edge, #38bdf8)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="var(--dash-sun-halo-edge, #38bdf8)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id("ray")} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--dash-sun-ray, #fffbeb)" stopOpacity="0" />
          <stop offset="35%" stopColor="var(--dash-sun-ray, #fffbeb)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--dash-sun-ray, #fef3c7)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <circle cx="120" cy="120" r="108" fill={`url(#${id("glow-b")})`} />
      <circle cx="120" cy="120" r="88" fill={`url(#${id("glow-a")})`} />

      <g className="dashboard-sun-svg__rays" opacity="0.9">
        {[0, 30, 60, 90, 120, 150].map((deg) => (
          <rect
            key={deg}
            x="118"
            y="44"
            width="4"
            height="36"
            rx="2"
            fill={`url(#${id("ray")})`}
            transform={`rotate(${deg} 120 120)`}
          />
        ))}
      </g>

      <circle cx="120" cy="120" r="46" fill={`url(#${id("core")})`} />
      <circle
        cx="120"
        cy="120"
        r="46"
        fill="none"
        stroke="var(--dash-sun-rim, #fffef5)"
        strokeWidth="1.5"
        strokeOpacity="0.55"
      />
    </svg>
  );
}
