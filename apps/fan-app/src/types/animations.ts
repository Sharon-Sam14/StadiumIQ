// ============================================================
// ANIMATION TYPES
// ============================================================

export type PulseSeverity = "low" | "medium" | "high";

export interface BallConfig {
  readonly id: string;
  readonly delay: string;
  readonly duration: string;
  readonly scale: number;
  readonly startX: number;
  readonly startY: number;
  readonly tx: number;
  readonly ty: number;
}
