import React, { useState, useCallback, useEffect } from "react";
import {
  AlertTriangle, MapPin, MessageSquare, Ticket, ChevronRight,
  Navigation, Clock, Users, ChevronDown, ChevronUp, Check
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, AIBadge } from "@/components/ui/Badge";
import type { AccessibilityNeed, VendorQueueInfo } from "@/types/fan";
import type { RegisteredAccessibilityNeed } from "@/hooks/useAccessibilityNeeds";

// ============================================================
// HOME TAB
// ============================================================

const SURGE_ALERTS = [
  {
    id: "surge-1",
    zone: "Gate A",
    occupancy: 92,
    severity: "high" as const,
    message: "Gate A is at 92% capacity — all Section 200–250 fans are directed to use Gate B for faster entry.",
    recommendation: "Use Gate B",
  },
  {
    id: "surge-2",
    zone: "Concourse 3",
    occupancy: 74,
    severity: "medium" as const,
    message: "Concourse 3 food vendor queue is moderately congested. Optimal visit window: 80th minute.",
    recommendation: "Visit after 80th min",
  },
];

const VENDOR_QUEUE_DATA: VendorQueueInfo[] = [
  { vendorId: "v1", name: "Halal Bites",        zone: "West Concourse, Sec 112", estimatedWaitMinutes: 3,  bestTimeNote: "Best time to visit: 80th minute" },
  { vendorId: "v2", name: "Stadium Grill",       zone: "East Concourse, Sec 220", estimatedWaitMinutes: 7,  bestTimeNote: "Less busy after half-time whistle" },
  { vendorId: "v3", name: "Vegan Corner",        zone: "North Plaza",             estimatedWaitMinutes: 2,  bestTimeNote: "Currently at low capacity" },
  { vendorId: "v4", name: "FIFA Merch Cafe",     zone: "Main Lobby, Gate B",      estimatedWaitMinutes: 12, bestTimeNote: "Peak times: post-match & halftime" },
  { vendorId: "v5", name: "Freshco Beverages",   zone: "South Concourse, Sec 310",estimatedWaitMinutes: 5,  bestTimeNote: "Optimal: first 15 mins of halftime" },
];

const ACCESSIBILITY_OPTIONS: { need: AccessibilityNeed; label: string; detail: string }[] = [
  {
    need: "wheelchair_routing",
    label: "Wheelchair Routing",
    detail: "Accessible ramps and wide-aisle routes to your seat and facilities",
  },
  {
    need: "visual_impairment",
    label: "Visual Impairment Assistance",
    detail: "Verbal guidance and tactile orientation support from stadium volunteers",
  },
  {
    need: "hearing_impairment",
    label: "Hearing Impairment Support",
    detail: "Visual alerts, written communication, and loop system zones flagged",
  },
];

interface HomeTabProps {
  readonly onNavigateToTab: (tab: string) => void;
  readonly onOpenTransportPlanner: () => void;
  readonly onRegisterAccessibilityNeeds: (needs: AccessibilityNeed[]) => void;
  readonly registeredNeeds: RegisteredAccessibilityNeed[];
}

export const HomeTab = React.memo(function HomeTab({
  onNavigateToTab,
  onOpenTransportPlanner,
  onRegisterAccessibilityNeeds,
  registeredNeeds,
}: HomeTabProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [vendors, setVendors] = useState<VendorQueueInfo[]>([]);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [selectedNeeds, setSelectedNeeds] = useState<AccessibilityNeed[]>([]);
  const [needsSubmitted, setNeedsSubmitted] = useState(registeredNeeds.length > 0);

  useEffect(() => {
    // Simulate 1.5s load
    const timer = setTimeout(() => {
      setVendors(VENDOR_QUEUE_DATA);
      setIsLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Refresh vendor queues every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setVendors((prev) =>
        prev.map((v) => ({
          ...v,
          estimatedWaitMinutes: Math.max(1, v.estimatedWaitMinutes + Math.floor(Math.random() * 5) - 2),
        }))
      );
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleNeed = useCallback((need: AccessibilityNeed): void => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  }, []);

  const handleSubmitNeeds = useCallback((): void => {
    if (selectedNeeds.length === 0) return;
    onRegisterAccessibilityNeeds(selectedNeeds);
    setNeedsSubmitted(true);
    setAccessibilityOpen(false);
  }, [selectedNeeds, onRegisterAccessibilityNeeds]);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Surge Advisory Cards */}
      <section aria-label="Stadium surge advisories">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-[var(--brand-gold)]" aria-hidden="true" />
          <h2 className="font-display font-bold text-xs uppercase tracking-widest text-[var(--text-secondary)]">
            Live Surge Advisories
          </h2>
        </div>
        <div className="space-y-3">
          {SURGE_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border p-4 flex gap-3 ${
                alert.severity === "high"
                  ? "bg-red-900/20 border-red-500/30"
                  : "bg-yellow-900/20 border-yellow-500/30"
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${alert.severity === "high" ? "text-red-400" : "text-yellow-400"}`}
                aria-hidden="true"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-xs text-[var(--text-primary)]">{alert.zone}</span>
                  <Badge variant={alert.severity === "high" ? "danger" : "warning"} size="xs">
                    {alert.occupancy}% Full
                  </Badge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{alert.message}</p>
                <p className="text-[10px] font-bold text-[var(--brand-gold)] mt-1">
                  AI Recommendation: {alert.recommendation}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Digital Ticket Summary */}
      <button
        onClick={() => onNavigateToTab("ticket")}
        className="w-full text-left rounded-xl border border-[var(--brand-gold)]/20 bg-gradient-to-br from-[var(--brand-green-deep)]/30 via-[var(--bg-surface)] to-[var(--bg-surface)] p-5 relative overflow-hidden hover:border-[var(--brand-gold)]/40 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
        aria-label="View your digital ticket for Match 82"
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--brand-gold)] bg-[var(--brand-gold)]/10 px-2 py-0.5 rounded-full border border-[var(--brand-gold)]/20">
              FIFA World Cup 2026
            </span>
            <h3 className="font-display font-black text-xl text-[var(--text-primary)] mt-2">
              ROUND OF 16
            </h3>
            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 uppercase tracking-wider">
              MetLife Stadium — Match 82
            </p>
          </div>
          <Ticket className="w-6 h-6 text-[var(--brand-gold)]" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-4 gap-2 border-t border-[var(--border-subtle)] pt-3">
          {[
            { label: "SEC", value: "212" },
            { label: "ROW", value: "12" },
            { label: "SEAT", value: "4" },
            { label: "GATE", value: "B" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-[9px] text-[var(--text-tertiary)] uppercase">{label}</p>
              <p className="font-display font-bold text-base text-[var(--text-primary)]">{value}</p>
            </div>
          ))}
        </div>
        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
      </button>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigateToTab("navigate")}
          className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Open indoor navigation map"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-gold)]/10 flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-[var(--brand-gold)]" aria-hidden="true" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[var(--text-primary)]">Indoor Nav</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">Find your way</p>
          </div>
        </button>

        <button
          onClick={() => onNavigateToTab("assistant")}
          className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)] hover:-translate-y-0.5 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          aria-label="Open AI concierge assistant"
        >
          <div className="w-10 h-10 rounded-lg bg-[var(--brand-green-deep)]/40 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-[var(--brand-gold)]" aria-hidden="true" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-[var(--text-primary)]">AI Concierge</p>
            <p className="text-[10px] text-[var(--text-tertiary)]">50+ languages</p>
          </div>
        </button>
      </div>

      {/* Post-Match Transport Planner */}
      <button
        onClick={onOpenTransportPlanner}
        className="w-full flex items-center justify-between p-4 rounded-xl border border-[var(--brand-gold)]/25 bg-[var(--brand-gold)]/5 hover:bg-[var(--brand-gold)]/10 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
        aria-label="Open post-match transportation planner"
      >
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-[var(--brand-gold)]" aria-hidden="true" />
          <div className="text-left">
            <p className="text-sm font-bold text-[var(--text-primary)]">Plan My Exit</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <AIBadge label="AI-Powered" />
              <span className="text-[10px] text-[var(--text-tertiary)]">Post-match routes</span>
            </div>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
      </button>

      {/* Vendor Queue Intelligence */}
      <Card
        title="Vendor Queue Intelligence"
        headerRight={
          <div className="flex items-center gap-1.5">
            <AIBadge />
            <span className="text-[9px] text-[var(--text-tertiary)]">Updates every 30s</span>
          </div>
        }
      >
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 skeleton rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {vendors.slice(0, 5).map((vendor) => (
              <div
                key={vendor.vendorId}
                className="flex items-center justify-between p-2.5 rounded-lg bg-[var(--bg-elevated)]/50 border border-[var(--border-subtle)]"
              >
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{vendor.name}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)]">{vendor.zone}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Clock className="w-3 h-3 text-[var(--text-tertiary)]" aria-hidden="true" />
                    <span className={`text-xs font-bold ${
                      vendor.estimatedWaitMinutes <= 4 ? "text-green-400" :
                      vendor.estimatedWaitMinutes <= 8 ? "text-yellow-400" : "text-red-400"
                    }`}>
                      ~{vendor.estimatedWaitMinutes} min
                    </span>
                  </div>
                  <p className="text-[9px] text-[var(--text-tertiary)] mt-0.5">{vendor.bestTimeNote}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Accessibility Needs Registration */}
      <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
        <button
          onClick={() => setAccessibilityOpen((prev) => !prev)}
          className="w-full flex items-center justify-between p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
          aria-expanded={accessibilityOpen}
          aria-controls="accessibility-panel"
        >
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-[var(--brand-gold)]" aria-hidden="true" />
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Accessibility Needs</p>
              <p className="text-[10px] text-[var(--text-tertiary)]">
                {needsSubmitted ? "Registered — your volunteer has been notified" : "Register your needs so we can assist you"}
              </p>
            </div>
          </div>
          {needsSubmitted
            ? <Check className="w-4 h-4 text-green-400" aria-hidden="true" />
            : accessibilityOpen
            ? <ChevronUp className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
            : <ChevronDown className="w-4 h-4 text-[var(--text-tertiary)]" aria-hidden="true" />
          }
        </button>

        {accessibilityOpen && !needsSubmitted && (
          <div id="accessibility-panel" className="px-4 pb-4 space-y-3 border-t border-[var(--border-subtle)]">
            <p className="text-xs text-[var(--text-secondary)] mt-3">
              Select all that apply. Your designated section volunteer (Sec 200) will be notified immediately.
            </p>
            {ACCESSIBILITY_OPTIONS.map(({ need, label, detail }) => (
              <label
                key={need}
                className="flex items-start gap-3 p-3 rounded-lg border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--border-strong)] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedNeeds.includes(need)}
                  onChange={() => toggleNeed(need)}
                  className="mt-0.5 w-4 h-4 accent-[var(--brand-gold)] cursor-pointer"
                  aria-label={label}
                />
                <div>
                  <p className="text-xs font-semibold text-[var(--text-primary)]">{label}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{detail}</p>
                </div>
              </label>
            ))}
            <button
              onClick={handleSubmitNeeds}
              disabled={selectedNeeds.length === 0}
              className="w-full py-2.5 mt-2 rounded-lg bg-[var(--brand-gold)] text-black font-bold text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
              aria-label="Submit accessibility needs registration"
            >
              Notify My Volunteer
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
