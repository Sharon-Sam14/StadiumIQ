import React, { useState, useCallback } from "react";
import { X, MapPin, Clock, Train, Bus, Car, Zap } from "lucide-react";
import { AIBadge } from "@/components/ui/Badge";
import type { TransportRoute } from "@/types/fan";

// ============================================================
// TRANSPORT PLANNER MODAL — Post-Match Exit Planning
// ============================================================

const TRANSPORT_ROUTES: TransportRoute[] = [
  {
    id: "route-1",
    rank: 1,
    exitGate: "C",
    gateWaitMinutes: 2,
    mode: "NJ Transit Train",
    destination: "Newark Penn → NYC Penn Station",
    estimatedMinutes: 38,
    summary:
      "AI Recommended: Gate C has the lowest predicted congestion (2.4 min wait). NJ Transit departing Meadowlands Station at 22:45. Arrives NYC Penn Station by 23:23.",
  },
  {
    id: "route-2",
    rank: 2,
    exitGate: "B",
    gateWaitMinutes: 6,
    mode: "Express Shuttle Bus",
    destination: "MetLife → Times Square",
    estimatedMinutes: 55,
    summary:
      "Departs from Bus Bay 3 (Gate B side). WiFi-equipped coaches. Fare included in ticket for this match. Drop-off at 42nd St / 7th Ave.",
  },
  {
    id: "route-3",
    rank: 3,
    exitGate: "A",
    gateWaitMinutes: 14,
    mode: "Rideshare (Uber/Lyft)",
    destination: "Direct to destination",
    estimatedMinutes: 45,
    summary:
      "Pickup zone at Lot 15 (Gate A, north). High demand expected — surcharge likely. Ride requests may take 12–20 minutes to fulfil. Budget option: carpool via Lyft.",
  },
];

const MODE_ICONS: Record<string, React.ReactNode> = {
  "NJ Transit Train": <Train className="w-5 h-5" aria-hidden="true" />,
  "Express Shuttle Bus": <Bus className="w-5 h-5" aria-hidden="true" />,
  "Rideshare (Uber/Lyft)": <Car className="w-5 h-5" aria-hidden="true" />,
};

interface TransportPlannerModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export function TransportPlannerModal({
  isOpen,
  onClose,
}: TransportPlannerModalProps): React.JSX.Element | null {
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const handleClose = useCallback((): void => {
    setSelectedRouteId(null);
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Post-match transportation planner"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] overflow-hidden max-h-[92vh] flex flex-col animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <MapPin
                className="w-4 h-4 text-[var(--brand-gold)]"
                aria-hidden="true"
              />
              <h2 className="font-display font-bold text-sm text-[var(--text-primary)]">
                Post-Match Exit Planner
              </h2>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AIBadge label="AI-Powered" />
              <span className="text-[10px] text-[var(--text-tertiary)]">
                Based on real-time crowd and transport data
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Close transport planner"
          >
            <X
              className="w-4 h-4 text-[var(--text-secondary)]"
              aria-hidden="true"
            />
          </button>
        </div>

        {/* AI Summary */}
        <div className="px-5 py-3 bg-[var(--brand-gold)]/5 border-b border-[var(--brand-gold)]/15 shrink-0">
          <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--brand-gold)]">AI Analysis:</strong>{" "}
            Based on crowd flow predictions for tonight's match,{" "}
            <strong className="text-[var(--text-primary)]">
              Gate C exits are 72% less congested
            </strong>{" "}
            than Gate A. NJ Transit post-match service adds 8 extra trains.
            Rideshare demand peaks 15 minutes after final whistle.
          </p>
        </div>

        {/* Routes */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 scroll-thin">
          {TRANSPORT_ROUTES.map((route) => (
            <button
              key={route.id}
              onClick={() => setSelectedRouteId(route.id)}
              className={`w-full text-left rounded-xl border p-4 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)] ${
                selectedRouteId === route.id
                  ? "border-[var(--brand-gold)] bg-[var(--brand-gold)]/10"
                  : "border-[var(--border-subtle)] hover:border-[var(--border-strong)]"
              }`}
              aria-pressed={selectedRouteId === route.id}
              aria-label={`Route option ${route.rank}: ${route.mode} from Gate ${route.exitGate}, estimated ${route.estimatedMinutes} minutes`}
            >
              {/* Route Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0 text-[var(--brand-gold)]">
                  {MODE_ICONS[route.mode]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {route.rank === 1 && (
                      <span className="text-[9px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">
                        RECOMMENDED
                      </span>
                    )}
                    <span className="text-xs font-bold text-[var(--text-primary)] truncate">
                      {route.mode}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)] truncate">
                    {route.destination}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                      route.gateWaitMinutes <= 4
                        ? "text-green-400 bg-green-900/20 border-green-500/30"
                        : route.gateWaitMinutes <= 8
                          ? "text-yellow-400 bg-yellow-900/20 border-yellow-500/30"
                          : "text-red-400 bg-red-900/20 border-red-500/30"
                    }`}
                  >
                    Gate {route.exitGate} — {route.gateWaitMinutes} min wait
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock
                    className="w-3 h-3 text-[var(--text-tertiary)]"
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-bold text-[var(--text-primary)]">
                    ~{route.estimatedMinutes} min total
                  </span>
                </div>
              </div>

              {/* AI Summary */}
              <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
                {route.summary}
              </p>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[var(--border-subtle)] flex gap-3 shrink-0">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            Close
          </button>
          {selectedRouteId && (
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 rounded-xl bg-[var(--brand-gold)] text-black font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
              aria-label="Confirm selected exit route"
            >
              <Zap className="w-4 h-4" aria-hidden="true" />
              Confirm Route
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
