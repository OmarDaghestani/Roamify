import { useId } from "react";

/**
 * Editorial SVG clouds; palette from `.dashboard-atmosphere__day` CSS variables.
 * Gradients bias toward upper-right to match the sun. Gradient ids from useId stay unique.
 */
export default function DashboardCloudIllustration({ variant = "leading" }) {
  const uid = useId().replace(/:/g, "");
  const g = (suffix) => `dc-${variant}-${suffix}-${uid}`;

  /* Light from sun: upper-right → lower-left (screen space within viewBox). */
  const litX1 = "88%";
  const litY1 = "10%";
  const litX2 = "22%";
  const litY2 = "92%";

  if (variant === "mid") {
    return (
      <svg
        className="dashboard-cloud-svg"
        viewBox="0 0 400 150"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={g("top")} x1={litX1} y1={litY1} x2={litX2} y2={litY2}>
            <stop offset="0%" stopColor="var(--dash-cloud-highlight, #ffffff)" />
            <stop offset="42%" stopColor="var(--dash-cloud-face, #f8fafc)" />
            <stop offset="100%" stopColor="var(--dash-cloud-shadow, #e0f2fe)" />
          </linearGradient>
          <linearGradient id={g("rim")} x1={litX1} y1={litY1} x2={litX2} y2={litY2}>
            <stop offset="0%" stopColor="var(--dash-cloud-rim-lit, #f0f9ff)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--dash-cloud-rim-shade, #bae6fd)" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={g("under")} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="var(--dash-cloud-under-fade, #93c5fd)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--dash-cloud-under-mid, #7dd3fc)" stopOpacity="0.38" />
          </linearGradient>
        </defs>
        <g className="dashboard-cloud-svg__art">
          <ellipse cx="200" cy="118" rx="168" ry="36" fill={`url(#${g("under")})`} />
          <ellipse cx="72" cy="98" rx="52" ry="40" fill={`url(#${g("top")})`} />
          <ellipse cx="145" cy="82" rx="64" ry="46" fill={`url(#${g("top")})`} />
          <ellipse cx="228" cy="76" rx="76" ry="52" fill={`url(#${g("top")})`} />
          <ellipse cx="310" cy="88" rx="62" ry="44" fill={`url(#${g("top")})`} />
          <ellipse cx="355" cy="102" rx="44" ry="34" fill={`url(#${g("top")})`} />
          <path
            d="M 28 108 Q 200 52 372 108"
            fill="none"
            stroke={`url(#${g("rim")})`}
            strokeWidth="1.25"
            strokeLinecap="round"
            opacity="0.55"
          />
        </g>
      </svg>
    );
  }

  if (variant === "bank") {
    return (
      <svg
        className="dashboard-cloud-svg"
        viewBox="0 0 620 128"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={g("top")} x1={litX1} y1={litY1} x2={litX2} y2={litY2}>
            <stop offset="0%" stopColor="var(--dash-cloud-bank-lit, #fffefb)" />
            <stop offset="38%" stopColor="var(--dash-cloud-face, #f8fafc)" />
            <stop offset="100%" stopColor="var(--dash-cloud-shadow, #dbeafe)" />
          </linearGradient>
          <linearGradient id={g("under")} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="var(--dash-cloud-rim-shade, #bae6fd)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--dash-cloud-under-deep, #38bdf8)" stopOpacity="0.24" />
          </linearGradient>
        </defs>
        <g className="dashboard-cloud-svg__art">
          <ellipse cx="310" cy="98" rx="268" ry="28" fill={`url(#${g("under")})`} />
          <ellipse cx="95" cy="78" rx="88" ry="44" fill={`url(#${g("top")})`} />
          <ellipse cx="205" cy="62" rx="102" ry="50" fill={`url(#${g("top")})`} />
          <ellipse cx="335" cy="58" rx="110" ry="54" fill={`url(#${g("top")})`} />
          <ellipse cx="455" cy="72" rx="92" ry="46" fill={`url(#${g("top")})`} />
          <ellipse cx="545" cy="86" rx="58" ry="36" fill={`url(#${g("top")})`} />
        </g>
      </svg>
    );
  }

  return (
    <svg
      className="dashboard-cloud-svg"
      viewBox="0 0 520 176"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <linearGradient id={g("top")} x1={litX1} y1={litY1} x2={litX2} y2={litY2}>
          <stop offset="0%" stopColor="var(--dash-cloud-highlight, #ffffff)" />
          <stop offset="40%" stopColor="var(--dash-cloud-face, #fafafa)" />
          <stop offset="100%" stopColor="var(--dash-cloud-shadow, #e0f2fe)" />
        </linearGradient>
        <linearGradient id={g("highlight")} x1={litX1} y1={litY1} x2="40%" y2="55%">
          <stop offset="0%" stopColor="var(--dash-cloud-highlight, #ffffff)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--dash-cloud-rim-lit, #f0f9ff)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={g("under")} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="var(--dash-cloud-under-mid, #7dd3fc)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--dash-cloud-under-deep, #0ea5e9)" stopOpacity="0.22" />
        </linearGradient>
        <radialGradient id={g("bloom")} cx="76%" cy="18%" r="58%">
          <stop offset="0%" stopColor="var(--dash-cloud-highlight, #ffffff)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--dash-cloud-shadow, #e0f2fe)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="dashboard-cloud-svg__art">
        <ellipse cx="262" cy="128" rx="210" ry="40" fill={`url(#${g("under")})`} />
        <ellipse cx="268" cy="118" rx="198" ry="52" fill={`url(#${g("bloom")})`} opacity="0.88" />
        <ellipse cx="88" cy="112" rx="58" ry="46" fill={`url(#${g("top")})`} />
        <ellipse cx="168" cy="92" rx="78" ry="56" fill={`url(#${g("top")})`} />
        <ellipse cx="268" cy="80" rx="96" ry="62" fill={`url(#${g("top")})`} />
        <ellipse cx="368" cy="90" rx="74" ry="52" fill={`url(#${g("top")})`} />
        <ellipse cx="438" cy="104" rx="56" ry="42" fill={`url(#${g("top")})`} />
        <ellipse cx="485" cy="118" rx="38" ry="30" fill={`url(#${g("top")})`} />
        <ellipse cx="318" cy="58" rx="128" ry="30" fill={`url(#${g("highlight")})`} opacity="0.58" />
      </g>
    </svg>
  );
}
