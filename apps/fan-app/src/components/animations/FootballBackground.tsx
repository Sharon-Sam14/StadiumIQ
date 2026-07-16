import React from "react";
import { FootballIcon } from "@/components/ui/FootballIcon";
import { FLOATING_BALLS } from "@/utils/animationConstants";

// ============================================================
// 1. ONBOARDING HERO BACKGROUND — Football Pitch & Floating Balls
// ============================================================

export const FootballBackground = React.memo(
  function FootballBackground(): React.JSX.Element {
    return (
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0 bg-[#070b16]"
        role="presentation"
      >
        {/* 2D Schematic Football Pitch */}
        <svg
          className="absolute inset-0 w-full h-full opacity-15"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {/* Outlines */}
          <rect
            x="5"
            y="5"
            width="90"
            height="90"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.5"
          />

          {/* Halfway line */}
          <line
            x1="50"
            y1="5"
            x2="50"
            y2="95"
            stroke="#c9a227"
            strokeWidth="0.5"
          />

          {/* Center circle */}
          <circle
            cx="50"
            cy="50"
            r="12"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.5"
          />
          <circle cx="50" cy="50" r="0.8" fill="#c9a227" />

          {/* Penalty areas */}
          {/* Left */}
          <rect
            x="5"
            y="25"
            width="15"
            height="50"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.5"
          />
          <rect
            x="5"
            y="35"
            width="6"
            height="30"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.5"
          />
          <circle cx="20" cy="50" r="0.8" fill="#c9a227" />
          <path
            d="M 20 42 A 10 10 0 0 1 20 58"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.5"
          />

          {/* Right */}
          <rect
            x="80"
            y="25"
            width="15"
            height="50"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.5"
          />
          <rect
            x="89"
            y="35"
            width="6"
            height="30"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.5"
          />
          <circle cx="80" cy="50" r="0.8" fill="#c9a227" />
          <path
            d="M 80 42 A 10 10 0 0 0 80 58"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.5"
          />

          {/* Corner arcs */}
          <path
            d="M 5 8 A 3 3 0 0 0 8 5"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.4"
          />
          <path
            d="M 95 8 A 3 3 0 0 1 92 5"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.4"
          />
          <path
            d="M 5 92 A 3 3 0 0 1 8 95"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.4"
          />
          <path
            d="M 95 92 A 3 3 0 0 0 92 95"
            fill="none"
            stroke="#c9a227"
            strokeWidth="0.4"
          />
        </svg>

        {/* Floating Footballs */}
        {FLOATING_BALLS.map((ball, i) => (
          <div
            key={ball.id}
            className={`absolute animate-pitch-${i + 1}`}
            style={{
              left: `${ball.startX}%`,
              top: `${ball.startY}%`,
              transform: `scale(${ball.scale})`,
              animationDelay: ball.delay,
              animationDuration: ball.duration,
              willChange: "transform, opacity",
            }}
          >
            <FootballIcon size={24} />
          </div>
        ))}
      </div>
    );
  },
);
