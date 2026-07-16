import React, { useEffect, useState } from "react";
import { FootballIcon } from "@/components/ui/FootballIcon";

// ============================================================
// 6. GOAL CELEBRATION BURST — One-Shot Level Up Burst
// Shoots a ball upward and explodes 8 sparks radially.
// ============================================================

interface GoalCelebrationProps {
  readonly active: boolean;
  readonly onComplete?: () => void;
}

export const GoalCelebration = React.memo(function GoalCelebration({
  active,
  onComplete,
}: GoalCelebrationProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (active) {
      setVisible(true);
      timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [active, onComplete]);

  if (!visible) return null;

  // Calculate coordinates for 8 angles (0, 45, 90, 135, 180, 225, 270, 315) travelling 60px
  const sparks = Array.from({ length: 8 }).map((_, i) => {
    const rad = (i * 45 * Math.PI) / 180;
    const tx = Math.round(Math.cos(rad) * 60);
    const ty = Math.round(Math.sin(rad) * 60);
    return { id: i, tx, ty };
  });

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-50 flex items-center justify-center overflow-visible"
      role="presentation"
    >
      {/* Upward shooting ball */}
      <div
        className="absolute animate-goal-shoot"
        style={{ transformOrigin: "center" }}
      >
        <FootballIcon size={40} />
      </div>

      {/* 8-Spark blast */}
      {sparks.map((spark) => (
        <svg
          key={spark.id}
          className="absolute animate-spark"
          style={
            {
              "--tx": `${spark.tx}px`,
              "--ty": `${spark.ty}px`,
              width: 8,
              height: 8,
              willChange: "transform, opacity",
            } as React.CSSProperties
          }
          viewBox="0 0 10 10"
          aria-hidden="true"
        >
          <circle cx="5" cy="5" r="4" fill="#e8c84a" />
        </svg>
      ))}
    </div>
  );
});
