import type { BallConfig } from "@/types/animations";

// ============================================================
// ANIMATION CONSTANTS
// ============================================================

export const FLOATING_BALLS_COUNT = 6;

export const FLOATING_BALLS: readonly BallConfig[] = [
  { id: "ball-1", startX: 10, startY: 20, tx: 80,  ty: 40,  scale: 1.0, duration: "8s",  delay: "0s"   },
  { id: "ball-2", startX: 75, startY: 15, tx: -90, ty: 60,  scale: 0.8, duration: "11s", delay: "-2s"  },
  { id: "ball-3", startX: 30, startY: 80, tx: 100, ty: -50, scale: 1.2, duration: "14s", delay: "-4s"  },
  { id: "ball-4", startX: 85, startY: 70, tx: -80, ty: -40, scale: 0.9, duration: "9s",  delay: "-1.5s" },
  { id: "ball-5", startX: 50, startY: 45, tx: 50,  ty: 80,  scale: 1.1, duration: "13s", delay: "-5s"  },
  { id: "ball-6", startX: 15, startY: 60, tx: 90,  ty: -70, scale: 0.7, duration: "10s", delay: "-3s"  },
] as const;

export const PULSE_THRESHOLDS = {
  WARNING: 70,
  CRITICAL: 90,
} as const;
