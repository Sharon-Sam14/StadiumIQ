import React, { useState, useCallback, useEffect } from "react";
import {
  AlertTriangle, X, Siren,
  Users, Clock, Zap, ArrowUpDown
} from "lucide-react";
import { AIBadge, SeverityBadge, StatusBadge } from "@/components/ui/Badge";
import { SkeletonCard, SkeletonTableRow } from "@/components/ui/Skeleton";
import { formatRelativeTime, formatMatchClock, densityToColor, densityToLabel } from "@/utils/formatters";
import { useMatchClock } from "@/hooks/useMatchClock";
import type { IncidentStatus } from "@/types/incidents";
import type { UseIncidentsReturn } from "@/hooks/useIncidents";
import { CrowdPulseRing } from "@/components/animations/CrowdPulseRing";

// ============================================================
// COMMAND CENTER VIEW
// ============================================================

// ── Surge Forecast Data ─────────────────────────────────────
const SURGE_DATA = [
  { minute: "0",  gateA: 20,  gateB: 15, south: 10 },
  { minute: "15", gateA: 45,  gateB: 35, south: 28 },
  { minute: "30", gateA: 72,  gateB: 48, south: 55 },
  { minute: "45", gateA: 85,  gateB: 60, south: 70 },
  { minute: "60", gateA: 92,  gateB: 40, south: 65 },
  { minute: "75", gateA: 88,  gateB: 32, south: 60 },
  { minute: "90", gateA: 78,  gateB: 72, south: 90 },
  { minute: "+5", gateA: 60,  gateB: 95, south: 88 },
];

// ── AI Advisor Responses ─────────────────────────────────────
const AI_ADVISOR_RESPONSES = [
  "Surge Model predicts Gate A will reach 97% occupancy at 22:18 (75th min). Immediate redirect to Gate B is recommended. Deploy 2 additional stewards at Gate A funnel point.",
  "Concourse 3 vendor queue is reaching unsafe wait density. Activating Queue Intelligence advisory to fans — estimating 35% queue reduction over 12 minutes.",
  "Weather data indicates light precipitation at 22:00. Recommend opening indoor shelter corridors D4 and E2. Expect 8–12% increase in concourse congestion.",
  "Security anomaly detected at Staff Entrance B (camera 07). Pattern does not match authorised personnel flow. Flagging for Security Team Alpha review.",
  "Post-match transport AI: predicted exit surge of 77,000 fans over 18 minutes. Recommend NJ Transit message to fans now (T-20 minutes). Expected platform dwell time: 6.4 minutes.",
];

// ── Evacuation Zones ─────────────────────────────────────────
const EVACUATION_PLAN = [
  { zone: "North Sections",  gate: "Gate D",  estimatedMinutes: 8,  status: "Ready",    personnel: 12 },
  { zone: "South Sections",  gate: "Gate C",  estimatedMinutes: 10, status: "Ready",    personnel: 14 },
  { zone: "East Sections",   gate: "Gate E",  estimatedMinutes: 12, status: "Standby",  personnel: 8  },
  { zone: "West Sections",   gate: "Gate A",  estimatedMinutes: 15, status: "Warning",  personnel: 6  },
  { zone: "VIP/Premium",     gate: "Gate V",  estimatedMinutes: 5,  status: "Ready",    personnel: 4  },
];

type StatusFilter = "all" | IncidentStatus;

interface CommandCenterProps {
  readonly incidentHook: UseIncidentsReturn;
}

export const CommandCenter = React.memo(function CommandCenter({
  incidentHook,
}: CommandCenterProps): React.JSX.Element {
  const { incidents, updateStatus } = incidentHook;
  const { elapsedSeconds } = useMatchClock();

  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [aiAdvisorIdx, setAiAdvisorIdx] = useState(0);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState(false);
  const [isEvacuationActive, setIsEvacuationActive] = useState(false);
  const [currentCrowdDensity, setCurrentCrowdDensity] = useState({
    gateA: 92, gateB: 18, north: 55, south: 63,
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  // Cycle crowd density every 5s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentCrowdDensity((prev) => ({
        gateA:  Math.max(5,  Math.min(99, prev.gateA  + Math.floor(Math.random() * 7) - 3)),
        gateB:  Math.max(5,  Math.min(99, prev.gateB  + Math.floor(Math.random() * 7) - 3)),
        north:  Math.max(5,  Math.min(99, prev.north  + Math.floor(Math.random() * 9) - 4)),
        south:  Math.max(5,  Math.min(99, prev.south  + Math.floor(Math.random() * 9) - 4)),
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Rotate AI advisor message every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      setAiAdvisorIdx((i) => (i + 1) % AI_ADVISOR_RESPONSES.length);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredIncidents = incidents
    .filter((i) => statusFilter === "all" || i.status === statusFilter)
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortDesc ? timeB - timeA : timeA - timeB;
    });

  const activeCount   = incidents.filter((i) => i.status === "active").length;

  const medicalCount = incidents.filter((i) => i.status !== "resolved" && i.category === "medical").length;
  const securityCount = incidents.filter((i) => i.status !== "resolved" && i.category === "security").length;
  const infraCount = incidents.filter((i) => i.status !== "resolved" && i.category === "infrastructure").length;
  const avgOccupancy = Math.round(
    (currentCrowdDensity.gateA + currentCrowdDensity.gateB + currentCrowdDensity.north + currentCrowdDensity.south) / 4
  );

  const handleUpdateStatus = useCallback((id: string, status: IncidentStatus): void => {
    updateStatus(id, status);
  }, [updateStatus]);

  const handleConfirmEmergency = useCallback((): void => {
    setIsEmergencyOpen(false);
    setIsEvacuationActive(true);
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] animate-fade-in">
      {/* Emergency Modal */}
      {isEmergencyOpen && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Emergency Evacuation Confirmation"
        >
          <div className="bg-[var(--bg-surface)] border border-red-500/40 rounded-2xl p-6 max-w-md w-full text-center shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
              <Siren className="w-8 h-8 text-red-400" aria-hidden="true" />
            </div>
            <h2 className="font-display font-black text-xl text-[var(--text-primary)] mb-2">
              CONFIRM EMERGENCY PROTOCOL
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed">
              This will activate the <strong className="text-red-400">full stadium evacuation protocol</strong>:{" "}
              fan-facing safety broadcasts, steward mobilisation, PA system alerts, and gate capacity overrides.
              This action is <strong className="text-red-400">irreversible</strong> once confirmed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setIsEmergencyOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label="Cancel emergency confirmation"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEmergency}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white font-display font-bold text-sm hover:bg-red-500 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400"
                aria-label="Confirm and activate emergency evacuation"
              >
                CONFIRM EVACUATE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Evacuation Active Banner */}
      {isEvacuationActive && (
        <div
          className="bg-red-900/60 border-b border-red-500/50 px-6 py-3 flex items-center gap-3"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          <Siren className="w-5 h-5 text-red-300 animate-pulse" aria-hidden="true" />
          <span className="text-sm font-bold text-red-200">
            [EMERGENCY ACTIVE] Evacuation protocol is live. All gate staff have been alerted. Fan broadcast in progress.
          </span>
          <button
            onClick={() => setIsEvacuationActive(false)}
            className="ml-auto text-red-300 hover:text-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label="Dismiss evacuation alert"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-display font-black text-2xl text-[var(--text-primary)]">
              Command Center
            </h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs text-[var(--text-tertiary)]">Match 82 — MetLife Stadium</span>
              <span className="flex items-center gap-1 text-xs font-mono text-[var(--brand-gold)] font-bold">
                <Clock className="w-3 h-3" aria-hidden="true" />
                {formatMatchClock(elapsedSeconds)}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-900/20 border border-green-500/30 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
                WS Live
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsEmergencyOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 font-bold text-sm hover:bg-red-600/30 hover:border-red-500/60 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 animate-gold-pulse"
            aria-label="Trigger stadium emergency evacuation protocol"
          >
            <Siren className="w-4 h-4" aria-hidden="true" />
            Emergency Protocol
          </button>
        </div>

        {/* Metrics Bar */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} lines={2} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Crowd Intelligence (occupancy + Pulse Ring) */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between mb-2 z-10">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Crowd Intelligence</span>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                  avgOccupancy >= 90 ? "text-red-400 bg-red-900/20 border-red-500/30" :
                  avgOccupancy >= 70 ? "text-orange-400 bg-orange-900/20 border-orange-500/30" :
                  "text-green-400 bg-green-900/20 border-green-500/30"
                }`}>
                  {avgOccupancy >= 90 ? "Critical" : avgOccupancy >= 70 ? "Warning" : "Normal"}
                </span>
              </div>
              <p className="font-display font-black text-3xl text-white z-10 mt-1">{avgOccupancy}%</p>
              <p className="text-[9px] text-[var(--text-tertiary)] z-10">Average MetLife Occupancy</p>
              <CrowdPulseRing occupancy={avgOccupancy} />
            </div>

            {/* Card 2: Active Incidents */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center gap-1.5 text-red-400 mb-2">
                <AlertTriangle className="w-4 h-4" aria-hidden="true" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Active Incidents</span>
              </div>
              <p className="font-display font-black text-3xl text-red-400 mt-1">{activeCount}</p>
              <p className="text-[9.5px] text-[var(--text-secondary)] font-semibold mt-1">
                {medicalCount} Med • {securityCount} Sec • {infraCount} Infra
              </p>
            </div>

            {/* Card 3: Volunteer Activity */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center gap-1.5 text-[var(--brand-gold)] mb-2">
                <Users className="w-4 h-4" aria-hidden="true" />
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Volunteer Activity</span>
              </div>
              <p className="font-display font-black text-3xl text-[var(--brand-gold)] mt-1">42 / 50</p>
              <p className="text-[9.5px] text-[var(--text-secondary)] font-semibold mt-1">
                8 Standby • 34 Active on Duty
              </p>
            </div>

            {/* Card 4: Live Queue Wait Times */}
            <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Live Queue Wait Times</span>
              </div>
              <div className="space-y-1.5 w-full">
                {[
                  { gate: "A", time: "18.4 min", pct: 90, color: "bg-red-500" },
                  { gate: "B", time: "2.4 min",  pct: 20, color: "bg-green-500" },
                  { gate: "C", time: "6.1 min",  pct: 45, color: "bg-blue-500" },
                ].map((g) => (
                  <div key={g.gate} className="flex items-center gap-2 text-[8.5px]">
                    <span className="font-bold w-3 text-[var(--text-secondary)]">{g.gate}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden" role="presentation">
                      <div className={`h-full rounded-full ${g.color}`} style={{ width: `${g.pct}%` }} />
                    </div>
                    <span className="font-bold text-[var(--text-primary)] w-10 text-right">{g.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Zone Crowd Density */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              Zone Crowd Density — Live
            </h2>
            <span className="text-[9px] text-[var(--text-tertiary)]">Updates every 5s</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(currentCrowdDensity) as [string, number][]).map(([zone, density]) => (
              <div
                key={zone}
                className="rounded-lg p-3 border"
                style={{ borderColor: densityToColor(density).replace("0.65", "0.4") }}
              >
                <p className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
                  {zone.charAt(0).toUpperCase() + zone.slice(1)}
                </p>
                <div className="flex items-end gap-1.5">
                  <span
                    className="font-display font-black text-2xl"
                    style={{ color: densityToColor(density).replace("0.65", "1") }}
                  >
                    {density}%
                  </span>
                  <span className="text-[10px] text-[var(--text-tertiary)] mb-0.5">
                    {densityToLabel(density)}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full bg-[var(--bg-elevated)] mt-2 overflow-hidden"
                  role="progressbar"
                  aria-valuenow={density}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${zone} zone: ${density}% capacity — ${densityToLabel(density)}`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${density}%`,
                      background: densityToColor(density).replace("0.65", "1"),
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Surge Forecast Chart (SVG bar chart) */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              Surge Forecast — Crowd Occupancy by Gate
            </h2>
            <AIBadge label="AI-Predicted" />
          </div>
          <svg
            viewBox="0 0 340 120"
            className="w-full"
            style={{ maxHeight: 160 }}
            aria-label="Surge forecast chart showing predicted crowd occupancy percentages over match time for Gate A, Gate B, and South sections"
            role="img"
          >
            {/* Grid lines */}
            {[25, 50, 75, 100].map((v) => (
              <g key={v}>
                <line
                  x1="40" y1={100 - v}
                  x2="330" y2={100 - v}
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="0.5"
                  strokeDasharray="3,3"
                />
                <text x="33" y={100 - v + 3} fill="#627282" fontSize="6" textAnchor="end">{v}%</text>
              </g>
            ))}
            {/* Axis */}
            <line x1="40" y1="0" x2="40" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <line x1="40" y1="100" x2="330" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

            {/* Gate A line (red) */}
            <polyline
              fill="none"
              stroke="#EF4444"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={SURGE_DATA.map((d, i) => `${40 + i * 41},${100 - d.gateA}`).join(" ")}
            />
            {/* Gate B line (green) */}
            <polyline
              fill="none"
              stroke="#10B981"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={SURGE_DATA.map((d, i) => `${40 + i * 41},${100 - d.gateB}`).join(" ")}
            />
            {/* South line (gold) */}
            <polyline
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={SURGE_DATA.map((d, i) => `${40 + i * 41},${100 - d.south}`).join(" ")}
            />

            {/* X axis labels */}
            {SURGE_DATA.map((d, i) => (
              <text key={d.minute} x={40 + i * 41} y={110} fill="#627282" fontSize="5.5" textAnchor="middle">
                {d.minute}′
              </text>
            ))}
          </svg>
          <div className="flex gap-4 mt-2 text-[9px]">
            <span className="flex items-center gap-1.5 text-red-400"><span className="w-3 h-0.5 bg-red-400 inline-block rounded" aria-hidden="true" /> Gate A</span>
            <span className="flex items-center gap-1.5 text-green-400"><span className="w-3 h-0.5 bg-green-400 inline-block rounded" aria-hidden="true" /> Gate B</span>
            <span className="flex items-center gap-1.5 text-[var(--brand-gold)]"><span className="w-3 h-0.5 bg-[var(--brand-gold)] inline-block rounded" aria-hidden="true" /> South</span>
          </div>
        </div>

        {/* AI Advisor Panel */}
        <div className="rounded-xl border border-[var(--brand-gold)]/20 bg-[var(--brand-gold)]/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[var(--brand-gold)]" aria-hidden="true" />
                <span className="font-display font-bold text-xs uppercase tracking-widest text-[var(--brand-gold)]">
                  AI Operations Advisor
                </span>
                <AIBadge label="Live Advisory" />
              </div>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed animate-fade-in" key={aiAdvisorIdx}>
                {AI_ADVISOR_RESPONSES[aiAdvisorIdx]}
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 mt-4">
            {AI_ADVISOR_RESPONSES.map((_, i) => (
              <button
                key={i}
                onClick={() => setAiAdvisorIdx(i)}
                className={`h-1.5 rounded-full transition-all ${i === aiAdvisorIdx ? "w-6 bg-[var(--brand-gold)]" : "w-2 bg-[var(--border-strong)] hover:bg-[var(--border-strong)]"}`}
                aria-label={`Advisory message ${i + 1}`}
                aria-pressed={i === aiAdvisorIdx}
              />
            ))}
          </div>
        </div>

        {/* Incident Queue Table */}
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="font-display font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)]">
              Incident Queue ({filteredIncidents.length})
            </h2>
            <div className="flex items-center gap-2">
              {/* Status Filter */}
              <div className="flex gap-1" role="group" aria-label="Filter incidents by status">
                {(["all", "active", "assigned", "resolved"] as StatusFilter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      statusFilter === f
                        ? "bg-[var(--brand-gold)] text-black"
                        : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    }`}
                    aria-pressed={statusFilter === f}
                    aria-label={`Filter by ${f} status`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSortDesc((p) => !p)}
                className="p-1.5 rounded-lg bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                aria-label={sortDesc ? "Sort oldest first" : "Sort newest first"}
              >
                <ArrowUpDown className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs" aria-label="Incident queue">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-tertiary)] text-[9px] uppercase tracking-wider">
                  <th scope="col" className="text-left py-2 px-4">ID</th>
                  <th scope="col" className="text-left py-2 px-4">Description</th>
                  <th scope="col" className="text-left py-2 px-4">Category</th>
                  <th scope="col" className="text-left py-2 px-4">Severity</th>
                  <th scope="col" className="text-left py-2 px-4">Status</th>
                  <th scope="col" className="text-left py-2 px-4">Zone</th>
                  <th scope="col" className="text-left py-2 px-4">Time</th>
                  <th scope="col" className="text-left py-2 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 3 }).map((_, i) => <SkeletonTableRow key={i} columns={8} />)
                  : filteredIncidents.map((incident) => {
                    const isNewHigh = incident.severity === "high" && (Date.now() - new Date(incident.createdAt).getTime() < 8000);
                    return (
                      <tr
                        key={incident.id}
                        className={`border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-elevated)]/50 transition-colors ${
                          isNewHigh ? "animate-red-card" : ""
                        }`}
                      >
                      <td className="py-3 px-4 font-mono text-[var(--text-tertiary)] whitespace-nowrap">
                        {incident.id}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-primary)] max-w-[200px]">
                        <span className="line-clamp-2">{incident.description}</span>
                      </td>
                      <td className="py-3 px-4 capitalize text-[var(--text-secondary)] whitespace-nowrap">
                        {incident.category.replace("_", " ")}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <SeverityBadge severity={incident.severity} />
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <StatusBadge status={incident.status} />
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] whitespace-nowrap">
                        {incident.zone}
                      </td>
                      <td className="py-3 px-4 text-[var(--text-tertiary)] whitespace-nowrap">
                        {formatRelativeTime(incident.createdAt)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex gap-1.5">
                          {incident.status !== "assigned" && (
                            <button
                              onClick={() => handleUpdateStatus(incident.id, "assigned")}
                              className="px-2 py-1 rounded bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[9px] font-bold hover:bg-yellow-500/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                              aria-label={`Mark incident ${incident.id} as assigned`}
                            >
                              Assign
                            </button>
                          )}
                          {incident.status !== "resolved" && (
                            <button
                              onClick={() => handleUpdateStatus(incident.id, "resolved")}
                              className="px-2 py-1 rounded bg-green-500/20 border border-green-500/30 text-green-400 text-[9px] font-bold hover:bg-green-500/30 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                              aria-label={`Mark incident ${incident.id} as resolved`}
                            >
                              Resolve
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                }
              </tbody>
            </table>
          </div>
        </div>

        {/* Evacuation Plan Panel (shown only when active) */}
        {isEvacuationActive && (
          <div
            className="rounded-xl border border-red-500/30 bg-red-900/15 overflow-hidden animate-slide-up"
            role="region"
            aria-label="Active evacuation plan"
          >
            <div className="flex items-center gap-3 px-5 py-4 border-b border-red-500/20">
              <Siren className="w-4 h-4 text-red-400" aria-hidden="true" />
              <h2 className="font-display font-bold text-xs uppercase tracking-widest text-red-400">
                Evacuation Plan — Active
              </h2>
              <AIBadge label="AI-Optimised" />
            </div>
            <div className="p-5">
              <table className="w-full text-xs" aria-label="Evacuation route table">
                <thead>
                  <tr className="text-[var(--text-tertiary)] text-[9px] uppercase tracking-wider border-b border-[var(--border-subtle)] pb-2">
                    <th scope="col" className="text-left py-2">Zone</th>
                    <th scope="col" className="text-left py-2">Exit Gate</th>
                    <th scope="col" className="text-left py-2">Est. Time</th>
                    <th scope="col" className="text-left py-2">Personnel</th>
                    <th scope="col" className="text-left py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {EVACUATION_PLAN.map((zone) => (
                    <tr key={zone.zone} className="border-b border-[var(--border-subtle)]/50">
                      <td className="py-2.5 text-[var(--text-primary)]">{zone.zone}</td>
                      <td className="py-2.5 font-bold text-[var(--brand-gold)]">{zone.gate}</td>
                      <td className="py-2.5 text-[var(--text-secondary)]">{zone.estimatedMinutes} min</td>
                      <td className="py-2.5 text-[var(--text-secondary)]">{zone.personnel} staff</td>
                      <td className="py-2.5">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                          zone.status === "Ready"   ? "text-green-400 border-green-500/30 bg-green-900/20" :
                          zone.status === "Standby" ? "text-yellow-400 border-yellow-500/30 bg-yellow-900/20" :
                          "text-red-400 border-red-500/30 bg-red-900/20"
                        }`}>
                          {zone.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
