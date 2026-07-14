import React, { useEffect, useState } from "react";
import { FootballIcon } from "@/components/ui/FootballIcon";

// ============================================================
// 3. PAGE / ROLE TRANSITION — Ball Roll
// Rolls a football from left to right, triggering once per switch.
// ============================================================

interface BallRollProps {
  readonly active: boolean;
  readonly onComplete?: () => void;
}

export const BallRoll = React.memo(function BallRoll({
  active,
  onComplete,
}: BallRollProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(active);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    if (active) {
      setVisible(true);
      timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 600);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [active, onComplete]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 pointer-events-none select-none z-50 flex items-center overflow-hidden"
      role="presentation"
    >
      <div className="absolute left-0 animate-ball-roll" style={{ top: "50%" }}>
        <FootballIcon size={32} />
      </div>
    </div>
  );
});
