import React, { useState, useCallback } from "react";
import { Home, Navigation, MessageSquare, Ticket, Leaf } from "lucide-react";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { HomeTab }      from "./tabs/HomeTab";
import { NavigateTab }  from "./tabs/NavigateTab";
import { AssistantTab } from "./tabs/AssistantTab";
import { TicketTab }    from "./tabs/TicketTab";
import { EcoEarnTab }   from "./tabs/EcoEarnTab";
import { TransportPlannerModal } from "./modals/TransportPlannerModal";
import type { UseEcoPointsReturn } from "@/hooks/useEcoPoints";
import type { AccessibilityNeed } from "@/types/fan";
import type { RegisteredAccessibilityNeed } from "@/hooks/useAccessibilityNeeds";

// ============================================================
// FAN PORTAL — Five-tab role view
// ============================================================

type FanTab = "home" | "navigate" | "assistant" | "ticket" | "eco";

interface TabDef {
  readonly id: FanTab;
  readonly label: string;
  readonly shortLabel: string;
  readonly icon: React.ReactNode;
}

const TABS: readonly TabDef[] = [
  { id: "home",      label: "Home",         shortLabel: "Home",    icon: <Home         className="w-4 h-4" aria-hidden="true" /> },
  { id: "navigate",  label: "Navigate",     shortLabel: "Map",     icon: <Navigation   className="w-4 h-4" aria-hidden="true" /> },
  { id: "assistant", label: "AI Assistant", shortLabel: "Chat",    icon: <MessageSquare className="w-4 h-4" aria-hidden="true" /> },
  { id: "ticket",    label: "My Ticket",    shortLabel: "Ticket",  icon: <Ticket        className="w-4 h-4" aria-hidden="true" /> },
  { id: "eco",       label: "Eco Earn",     shortLabel: "Eco",     icon: <Leaf          className="w-4 h-4" aria-hidden="true" /> },
] as const;

interface FanPortalProps {
  readonly ecoHook: UseEcoPointsReturn;
  readonly registeredNeeds: RegisteredAccessibilityNeed[];
  readonly onRegisterAccessibilityNeeds: (needs: AccessibilityNeed[]) => void;
}

export const FanPortal = React.memo(function FanPortal({
  ecoHook,
  registeredNeeds,
  onRegisterAccessibilityNeeds,
}: FanPortalProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<FanTab>("home");
  const [transportPlannerOpen, setTransportPlannerOpen] = useState(false);

  const handleNavigateToTab = useCallback((tab: string): void => {
    const validTab = TABS.find((t) => t.id === tab);
    if (validTab) setActiveTab(validTab.id);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <nav
        className="sticky top-0 z-20 glass-strong border-b border-[var(--border-subtle)] shrink-0"
        aria-label="Fan Portal navigation"
      >
        <div className="flex" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              id={`fan-tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`fan-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex-1 flex flex-col items-center gap-1 py-3 px-1 text-[10px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)] ${
                activeTab === tab.id
                  ? "text-[var(--brand-gold)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
              {activeTab === tab.id && (
                <span
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--brand-gold)]"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="max-w-2xl mx-auto px-4 py-5">
          {/* Home */}
          <div
            id="fan-panel-home"
            role="tabpanel"
            aria-labelledby="fan-tab-home"
            hidden={activeTab !== "home"}
          >
            {activeTab === "home" && (
              <ErrorBoundary viewName="Home">
                <HomeTab
                  onNavigateToTab={handleNavigateToTab}
                  onOpenTransportPlanner={() => setTransportPlannerOpen(true)}
                  onRegisterAccessibilityNeeds={onRegisterAccessibilityNeeds}
                  registeredNeeds={registeredNeeds}
                />
              </ErrorBoundary>
            )}
          </div>

          {/* Navigate */}
          <div
            id="fan-panel-navigate"
            role="tabpanel"
            aria-labelledby="fan-tab-navigate"
            hidden={activeTab !== "navigate"}
          >
            {activeTab === "navigate" && (
              <ErrorBoundary viewName="Navigate">
                <NavigateTab />
              </ErrorBoundary>
            )}
          </div>

          {/* Assistant */}
          <div
            id="fan-panel-assistant"
            role="tabpanel"
            aria-labelledby="fan-tab-assistant"
            hidden={activeTab !== "assistant"}
            className="h-full"
          >
            {activeTab === "assistant" && (
              <ErrorBoundary viewName="Assistant">
                <AssistantTab />
              </ErrorBoundary>
            )}
          </div>

          {/* Ticket */}
          <div
            id="fan-panel-ticket"
            role="tabpanel"
            aria-labelledby="fan-tab-ticket"
            hidden={activeTab !== "ticket"}
          >
            {activeTab === "ticket" && (
              <ErrorBoundary viewName="My Ticket">
                <TicketTab />
              </ErrorBoundary>
            )}
          </div>

          {/* Eco Earn */}
          <div
            id="fan-panel-eco"
            role="tabpanel"
            aria-labelledby="fan-tab-eco"
            hidden={activeTab !== "eco"}
          >
            {activeTab === "eco" && (
              <ErrorBoundary viewName="Eco Earn">
                <EcoEarnTab ecoHook={ecoHook} />
              </ErrorBoundary>
            )}
          </div>
        </div>
      </div>

      {/* Transport Planner Modal */}
      <TransportPlannerModal
        isOpen={transportPlannerOpen}
        onClose={() => setTransportPlannerOpen(false)}
      />
    </div>
  );
});
