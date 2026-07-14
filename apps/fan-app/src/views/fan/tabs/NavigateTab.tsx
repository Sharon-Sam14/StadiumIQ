import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Eye, EyeOff, Accessibility } from "lucide-react";
import {
  triangulate, rssiToDistance, simulateRSSI, bezierPoint,
  type Point2D,
} from "@/utils/triangulate";
import { densityToColor, densityToLabel } from "@/utils/formatters";

// ============================================================
// NAVIGATE TAB — Indoor Wayfinding
// ============================================================

// Beacon reference positions on the 100×100 SVG coordinate grid
const BEACONS = [
  { id: "BCN-A", label: "Gate A Beacon",      x: 8,  y: 50 },
  { id: "BCN-B", label: "Gate B Beacon",      x: 92, y: 50 },
  { id: "BCN-C", label: "Sec 212 Beacon",     x: 50, y: 85 },
] as const;

// Bézier path: Gate B → Concourse → Seat 212
const PATH_P0: Point2D = { x: 92, y: 50 };
const PATH_P1: Point2D = { x: 70, y: 72 };
const PATH_P2: Point2D = { x: 30, y: 55 };

// Zone density data (simulated, updated every 5s)
interface HeatmapZone {
  id: string;
  label: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  density: number;
}

const INITIAL_ZONES: HeatmapZone[] = [
  { id: "z-gate-a",  label: "Gate A",      cx: 8,  cy: 50, rx: 9,  ry: 7,  density: 92 },
  { id: "z-gate-b",  label: "Gate B",      cx: 92, cy: 50, rx: 9,  ry: 7,  density: 18 },
  { id: "z-conc-n",  label: "North Conc.", cx: 50, cy: 22, rx: 18, ry: 6,  density: 55 },
  { id: "z-conc-s",  label: "South Conc.", cx: 50, cy: 78, rx: 18, ry: 6,  density: 63 },
  { id: "z-sec-212", label: "Sec 212",     cx: 30, cy: 55, rx: 8,  ry: 6,  density: 40 },
];

export const NavigateTab = React.memo(function NavigateTab(): React.JSX.Element {
  const [walkProgress, setWalkProgress] = useState(25);
  const [showAccessibleRoutes, setShowAccessibleRoutes] = useState(false);
  const [showTelemetry, setShowTelemetry] = useState(false);
  const [zones, setZones] = useState<HeatmapZone[]>(INITIAL_ZONES);

  // Update heatmap every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setZones((prev) =>
        prev.map((z) => ({
          ...z,
          density: Math.max(5, Math.min(99, z.density + Math.floor(Math.random() * 9) - 4)),
        }))
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Compute BLE trilateration
  const bleTelemetry = useMemo(() => {
    const userPos = bezierPoint(PATH_P0, PATH_P1, PATH_P2, walkProgress / 100);

    const signals = BEACONS.map((beacon, i) => {
      const trueDist = Math.hypot(userPos.x - beacon.x, userPos.y - beacon.y);
      const rssi = simulateRSSI(trueDist, i + 1);
      const estDist = rssiToDistance(rssi);
      return { ...beacon, trueDist, rssi, estDist };
    });

    const estimated = triangulate(
      signals[0].x, signals[0].y, signals[0].estDist,
      signals[1].x, signals[1].y, signals[1].estDist,
      signals[2].x, signals[2].y, signals[2].estDist
    );

    return { signals, estimated, userPos };
  }, [walkProgress]);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>): void => {
    setWalkProgress(Number(e.target.value));
  }, []);

  return (
    <div className="space-y-4 animate-fade-in">

      {/* Map Panel */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
        {/* Map Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="font-display font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              Indoor Wayfinding — MetLife Stadium
            </h2>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
              BLE Trilaterated Position • Gate B → Sec 212
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-green-500/15 border border-green-500/30 text-green-400 px-2 py-0.5 rounded-full font-bold uppercase">
              Gate B Clear
            </span>
          </div>
        </div>

        {/* SVG Map */}
        <div className="relative p-2 bg-[var(--bg-base)]">
          <svg
            viewBox="0 0 100 100"
            className="w-full"
            style={{ aspectRatio: "16/10" }}
            aria-label="MetLife Stadium indoor map with crowd density heatmap and your current position"
            role="img"
          >
            {/* Outer stadium boundary */}
            <ellipse cx="50" cy="50" rx="46" ry="35" fill="none" stroke="#1C2A38" strokeWidth="1.5" />
            {/* Inner ring / concourse */}
            <ellipse cx="50" cy="50" rx="36" ry="26" fill="none" stroke="#1C2A38" strokeWidth="1" />
            {/* Field */}
            <ellipse cx="50" cy="50" rx="22" ry="14" fill="#0C3A2B" fillOpacity="0.4" stroke="#1E6B52" strokeWidth="0.75" />
            <line x1="50" y1="36" x2="50" y2="64" stroke="#1E6B52" strokeWidth="0.3" strokeOpacity="0.5" />
            <ellipse cx="50" cy="50" rx="5" ry="5" fill="none" stroke="#1E6B52" strokeWidth="0.3" strokeOpacity="0.5" />

            {/* Heatmap overlays */}
            {zones.map((zone) => (
              <g key={zone.id} className="heatmap-zone">
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx}
                  ry={zone.ry}
                  fill={densityToColor(zone.density)}
                  style={{ transition: "fill 0.5s ease" }}
                >
                  <title>{zone.label}: {zone.density}% occupancy — {densityToLabel(zone.density)}</title>
                </ellipse>
              </g>
            ))}

            {/* Accessible routes overlay */}
            {showAccessibleRoutes && (
              <g aria-label="Accessible routes">
                <path
                  d="M 92 50 Q 82 42 75 40 Q 65 38 55 42 Q 45 46 35 50 Q 28 53 30 55"
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="1.2"
                  strokeDasharray="2.5,2"
                />
                <text x="60" y="39" fill="#A855F7" fontSize="3" fontFamily="Inter" fontWeight="bold">
                  Accessible Route
                </text>
              </g>
            )}

            {/* Navigation path (gold dashed) */}
            <path
              d="M 92 50 Q 70 72 30 55"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="0.8"
              strokeDasharray="2,1.5"
              opacity="0.75"
            />

            {/* Destination marker */}
            <circle cx="30" cy="55" r="2.5" fill="#D4AF37" />
            <text x="32.5" y="58" fill="#D4AF37" fontSize="3" fontFamily="Outfit" fontWeight="bold">
              Your Seat
            </text>

            {/* Gate labels */}
            <circle cx="8" cy="50" r="3" fill="#EF4444" opacity="0.9" />
            <text x="4" y="44" fill="#9AA8B6" fontSize="2.8" fontFamily="Inter">Gate A</text>
            <text x="3" y="47" fill="#EF4444" fontSize="2.5" fontFamily="Inter" fontWeight="bold">92%</text>

            <circle cx="92" cy="50" r="3" fill="#10B981" opacity="0.9" />
            <text x="80" y="44" fill="#9AA8B6" fontSize="2.8" fontFamily="Inter">Gate B</text>
            <text x="81" y="47" fill="#10B981" fontSize="2.5" fontFamily="Inter" fontWeight="bold">18%</text>

            {/* BLE Beacons */}
            {BEACONS.map((b) => (
              <circle
                key={b.id}
                cx={b.x}
                cy={b.y}
                r="1.5"
                fill="#3B82F6"
                opacity="0.8"
              >
                <title>{b.label} (BLE Reference Beacon)</title>
              </circle>
            ))}

            {/* Trilateration circles (estimated distances) */}
            {bleTelemetry.signals.map((s) => (
              <circle
                key={`ring-${s.id}`}
                cx={s.x}
                cy={s.y}
                r={Math.min(s.estDist * 0.6, 30)}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="0.3"
                opacity="0.2"
              />
            ))}

            {/* True position (dim gray) */}
            <circle
              cx={bleTelemetry.userPos.x}
              cy={bleTelemetry.userPos.y}
              r="1.5"
              fill="#627282"
              opacity="0.5"
            >
              <title>True simulated position</title>
            </circle>

            {/* Triangulated position (blue pulsing dot) */}
            <circle
              cx={bleTelemetry.estimated.x}
              cy={bleTelemetry.estimated.y}
              r="4"
              fill="#3B82F6"
              opacity="0.15"
            />
            <circle
              cx={bleTelemetry.estimated.x}
              cy={bleTelemetry.estimated.y}
              r="2.5"
              fill="#3B82F6"
            >
              <title>Your estimated position (BLE trilaterated)</title>
            </circle>
            <text
              x={bleTelemetry.estimated.x + 3.5}
              y={bleTelemetry.estimated.y + 1}
              fill="#3B82F6"
              fontSize="2.8"
              fontFamily="Inter"
              fontWeight="bold"
            >
              You
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-4 pb-3 pt-1 text-[9px] text-[var(--text-tertiary)]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" /> Low density
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-400" aria-hidden="true" /> Moderate
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" aria-hidden="true" /> High
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500" aria-hidden="true" /> Critical
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <span className="w-2 h-2 rounded-full bg-blue-500" aria-hidden="true" /> You (BLE)
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowAccessibleRoutes((p) => !p)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            showAccessibleRoutes
              ? "bg-purple-500/15 border-purple-500/40 text-purple-400"
              : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
          }`}
          aria-pressed={showAccessibleRoutes}
          aria-label={showAccessibleRoutes ? "Hide accessible routes" : "Show accessible routes"}
        >
          <Accessibility className="w-3.5 h-3.5" aria-hidden="true" />
          Accessible Routes
        </button>
        <button
          onClick={() => setShowTelemetry((p) => !p)}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-semibold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
            showTelemetry
              ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
              : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--text-secondary)]"
          }`}
          aria-pressed={showTelemetry}
          aria-label={showTelemetry ? "Hide BLE telemetry panel" : "Show BLE telemetry panel"}
        >
          {showTelemetry ? <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
          BLE Telemetry
        </button>
      </div>

      {/* Walk Simulator */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex justify-between items-center mb-3 text-xs">
          <span className="font-bold text-[var(--text-secondary)] uppercase tracking-wider">
            Walk Simulator
          </span>
          <span className="font-mono text-[var(--brand-gold)] font-bold">
            {walkProgress}% to Seat
          </span>
        </div>
        <label htmlFor="walk-progress-slider" className="sr-only">
          Simulate walking progress toward your seat (0 to 100 percent)
        </label>
        <input
          id="walk-progress-slider"
          type="range"
          min="0"
          max="100"
          value={walkProgress}
          onChange={handleProgressChange}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
          style={{ accentColor: "var(--brand-gold)" }}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={walkProgress}
          aria-valuetext={`${walkProgress}% of the way to your seat`}
        />
        <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] mt-1.5">
          <span>Gate B Entrance</span>
          <span>Section 212, Row 12</span>
        </div>
      </div>

      {/* BLE Telemetry Panel (collapsible) */}
      {showTelemetry && (
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 overflow-hidden animate-slide-up">
          <div className="px-4 py-3 border-b border-blue-500/15 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400">
              BLE RSSI Trilateration Matrix
            </p>
            <span className="font-mono text-[9px] text-[var(--brand-gold)] font-bold">
              Pos: ({Math.round(bleTelemetry.estimated.x)}, {Math.round(bleTelemetry.estimated.y)})
            </span>
          </div>
          <div className="p-3">
            <table className="w-full text-[10px] font-mono" aria-label="BLE beacon signal matrix">
              <thead>
                <tr className="text-[var(--text-tertiary)] border-b border-[var(--border-subtle)]">
                  <th scope="col" className="text-left pb-2">Beacon</th>
                  <th scope="col" className="text-right pb-2">RSSI</th>
                  <th scope="col" className="text-right pb-2">Est. Dist</th>
                </tr>
              </thead>
              <tbody>
                {bleTelemetry.signals.map((s, i) => (
                  <tr key={s.id} className="border-b border-[var(--border-subtle)]/50">
                    <td className="py-1.5 text-[var(--text-secondary)]">{s.id} ({s.label.split(" ")[0]})</td>
                    <td className={`py-1.5 text-right font-bold ${
                      i === 0 ? "text-red-400" : i === 1 ? "text-green-400" : "text-blue-400"
                    }`}>
                      {s.rssi} dBm
                    </td>
                    <td className="py-1.5 text-right text-[var(--text-primary)]">
                      {s.estDist.toFixed(1)}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[9px] text-[var(--text-tertiary)] mt-2.5 text-center">
              Triangulated via Bluetooth Low Energy (BLE) beacons using path-loss model:
              distance = 10^((-30 − RSSI) / 20)
            </p>
          </div>
        </div>
      )}
    </div>
  );
});
