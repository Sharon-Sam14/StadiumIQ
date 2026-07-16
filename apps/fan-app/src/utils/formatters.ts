// ============================================================
// FORMATTING UTILITIES
// ============================================================

/**
 * Formats elapsed seconds into MM:SS match clock format.
 * e.g. 4572 → "76:12"
 */
export function formatMatchClock(elapsedSeconds: number): string {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Formats large numbers with comma separators.
 * e.g. 78412 → "78,412"
 */
export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

/**
 * Calculates equivalent tree plantings from kg of CO₂ offset.
 * A tree absorbs ~21.77 kg of CO₂ per year.
 */
export const KG_CO2_PER_TREE = 21.77;

export function calcTreeEquivalence(carbonOffsetKg: number): number {
  return Math.floor(carbonOffsetKg / KG_CO2_PER_TREE);
}

/**
 * Formats a timestamp string to a readable time (HH:MM).
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Returns a relative time string (e.g. "2 min ago", "just now").
 */
export function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  if (diffSeconds < 30) return "just now";
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  return `${diffHours}h ago`;
}

/**
 * Returns the XP level label for a given XP total.
 * Levels: 0–199 = Bronze, 200–499 = Silver, 500–999 = Gold, 1000+ = Platinum
 */
export function getXPLevel(xp: number): { label: string; color: string } {
  if (xp >= 1000) return { label: "Platinum", color: "#E5E7EB" };
  if (xp >= 500) return { label: "Gold", color: "#D4AF37" };
  if (xp >= 200) return { label: "Silver", color: "#94A3B8" };
  return { label: "Bronze", color: "#92400E" };
}

/**
 * Returns percentage of XP progress toward the next level threshold.
 */
export function getXPProgress(xp: number): number {
  const thresholds = [200, 500, 1000];
  const currentThreshold = thresholds.find((t) => xp < t) ?? 1000;
  const prevThreshold =
    thresholds[thresholds.indexOf(currentThreshold) - 1] ?? 0;
  return Math.min(
    100,
    Math.round(
      ((xp - prevThreshold) / (currentThreshold - prevThreshold)) * 100,
    ),
  );
}

/**
 * Generates a unique ID string (collision-resistant enough for client-side use).
 */
export function generateId(prefix: string = "id"): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Converts a crowd density percentage to a heatmap color.
 * 0–40% → green, 40–70% → yellow, 70–85% → orange, 85–100% → red
 */
export function densityToColor(density: number): string {
  if (density >= 85) return "rgba(239, 68, 68, 0.65)"; // red
  if (density >= 70) return "rgba(249, 115, 22, 0.55)"; // orange
  if (density >= 40) return "rgba(234, 179, 8, 0.45)"; // yellow
  return "rgba(16, 185, 129, 0.30)"; // green
}

/**
 * Returns text label for density level (for accessibility — never color alone).
 */
export function densityToLabel(density: number): string {
  if (density >= 85) return "Critical";
  if (density >= 70) return "High";
  if (density >= 40) return "Moderate";
  return "Low";
}
