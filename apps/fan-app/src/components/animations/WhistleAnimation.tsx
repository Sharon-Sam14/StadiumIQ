import React from "react";

// ============================================================
// 9. VOLUNTEER TASK WHISTLE — SVG Checkmark & Expanding Ripple
// Handles draw-in check animation and radial ripple glow.
// ============================================================

interface WhistleAnimationProps {
  readonly active: boolean;
}

export const WhistleAnimation = React.memo(function WhistleAnimation({
  active,
}: WhistleAnimationProps): React.JSX.Element {
  return (
    <div
      className="relative w-5 h-5 flex items-center justify-center pointer-events-none select-none"
      role="presentation"
    >
      {/* Expanding Ripple Ring */}
      {active && (
        <div
          className="absolute inset-0 rounded-full border border-[#00a651] animate-whistle-rip"
          style={{ willChange: "transform, opacity" }}
        />
      )}

      {/* SVG Checkmark */}
      <svg
        className="w-3 h-3 text-white overflow-visible"
        viewBox="0 0 12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M 2 6.5 L 4.8 9.3 L 10 3"
          strokeDasharray="100"
          strokeDashoffset={active ? "0" : "100"}
          className={active ? "animate-draw-check" : ""}
          style={{
            transition: "stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        />
      </svg>
    </div>
  );
});
