import React, { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import type { SafetyBroadcastEvent } from "@/types/events";

// ============================================================
// SAFETY BANNER
// Uses aria-live="assertive" so screen readers announce immediately.
// Color is NEVER the sole indicator — always includes text label.
// ============================================================

interface SafetyBannerProps {
  readonly broadcast: SafetyBroadcastEvent | null;
  readonly onDismiss: () => void;
}

const SEVERITY_STYLES: Record<SafetyBroadcastEvent["severity"], string> = {
  high:   "bg-red-900/40 border-red-500/50 text-red-200",
  medium: "bg-yellow-900/40 border-yellow-500/50 text-yellow-200",
  low:    "bg-green-900/40 border-green-500/50 text-green-200",
};

const SEVERITY_LABELS: Record<SafetyBroadcastEvent["severity"], string> = {
  high:   "HIGH PRIORITY",
  medium: "ADVISORY",
  low:    "INFO",
};

export const SafetyBanner = React.memo(function SafetyBanner({
  broadcast,
  onDismiss,
}: SafetyBannerProps): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (broadcast) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [broadcast]);

  if (!broadcast || !visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`relative flex items-start gap-3 px-4 py-3 border-b text-sm animate-slide-in z-50 ${SEVERITY_STYLES[broadcast.severity]}`}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <span className="font-bold text-[10px] uppercase tracking-wider mr-2">
          [{SEVERITY_LABELS[broadcast.severity]}]
        </span>
        <span className="font-bold">{broadcast.title}: </span>
        <span>{broadcast.message}</span>
      </div>
      <button
        onClick={() => { setVisible(false); onDismiss(); }}
        className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2"
        aria-label="Dismiss safety alert"
      >
        <X className="w-3.5 h-3.5" aria-hidden="true" />
      </button>
    </div>
  );
});
