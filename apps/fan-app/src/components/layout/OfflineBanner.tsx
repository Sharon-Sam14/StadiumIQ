import React, { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

// ============================================================
// OFFLINE BANNER — Non-dismissible, monitors navigator.onLine
// Disappears automatically when connection is restored.
// ============================================================

export function OfflineBanner(): React.JSX.Element | null {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = (): void => setIsOffline(false);
    const handleOffline = (): void => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-500/20 border-b border-yellow-500/40 text-yellow-200 text-xs font-semibold"
    >
      <WifiOff className="w-3.5 h-3.5" aria-hidden="true" />
      <span>
        No internet connection. Live data is paused. Reconnecting
        automatically...
      </span>
    </div>
  );
}
