import React, { useMemo } from "react";
import { PULSE_THRESHOLDS } from "@/utils/animationConstants";

// ============================================================
// 5. CROWD PULSE RING — Radial Capacity Glow Rings
// Evaluates occupancy against warning/critical thresholds.
// ============================================================

interface CrowdPulseRingProps {
  readonly occupancy: number;
}

export const CrowdPulseRing = React.memo(function CrowdPulseRing({
  occupancy,
}: CrowdPulseRingProps): React.JSX.Element {
  const config = useMemo(() => {
    if (occupancy >= PULSE_THRESHOLDS.CRITICAL) {
      return {
        color: "#e53e3e",
        duration: "0.9s",
        rings: [0, 1, 2],
      };
    }
    if (occupancy >= PULSE_THRESHOLDS.WARNING) {
      return {
        color: "#dd6b20",
        duration: "1.4s",
        rings: [0, 1],
      };
    }
    return {
      color: "#00a651",
      duration: "2.0s",
      rings: [0],
    };
  }, [occupancy]);

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
      role="presentation"
    >
      <svg
        className="w-full h-full"
        viewBox="0 0 100 100"
        aria-hidden="true"
      >
        {config.rings.map((ringIdx) => (
          <circle
            key={ringIdx}
            cx="50"
            cy="50"
            r="38"
            fill="none"
            stroke={config.color}
            strokeWidth="2.5"
            className="animate-pulse-ring origin-center"
            style={{
              animationDuration: config.duration,
              animationDelay: `${ringIdx * 0.3}s`,
              transformOrigin: "center",
              willChange: "transform, opacity",
            }}
          />
        ))}
      </svg>
    </div>
  );
});
