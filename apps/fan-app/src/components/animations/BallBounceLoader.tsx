import React from "react";
import { FootballIcon } from "@/components/ui/FootballIcon";

// ============================================================
// 7. SKELETON LOADER — Bouncing Ball Wave Loader
// Rendered in card headers during simulated network delays.
// ============================================================

export const BallBounceLoader = React.memo(function BallBounceLoader(): React.JSX.Element {
  return (
    <div
      className="flex items-center gap-1.5 py-1 px-2 pointer-events-none select-none"
      role="presentation"
    >
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className="animate-wave-bounce"
          style={{
            animationDelay: `${idx * 0.2}s`,
            animationDuration: "0.6s",
            willChange: "transform",
          }}
        >
          <FootballIcon size={16} />
        </div>
      ))}
    </div>
  );
});
