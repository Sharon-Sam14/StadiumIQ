import React, { useState, useCallback, Suspense } from "react";
import {
  Sun, Moon, Accessibility, ChevronDown, Shield
} from "lucide-react";
import { clsx } from "clsx";

// Views
import { RoleSelectionPage } from "@/views/onboarding/RoleSelectionPage";
const FanPortal = React.lazy(() => import("@/views/fan/FanPortal").then(m => ({ default: m.FanPortal })));
const CommandCenter = React.lazy(() => import("@/views/command/CommandCenter").then(m => ({ default: m.CommandCenter })));
const VolunteerPortal = React.lazy(() => import("@/views/volunteer/VolunteerPortal").then(m => ({ default: m.VolunteerPortal })));

// Layout
import { SafetyBanner }  from "@/components/layout/SafetyBanner";
import { OfflineBanner } from "@/components/layout/OfflineBanner";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { StadiumTicker } from "@/components/layout/StadiumTicker";

// Animations
import { BallRoll } from "@/components/animations/BallRoll";
import { ScoreBug } from "@/components/animations/ScoreBug";

// Hooks
import { useTheme }              from "@/hooks/useTheme";
import { useWebSocket }          from "@/hooks/useWebSocket";
import { useEcoPoints }          from "@/hooks/useEcoPoints";
import { useIncidents }          from "@/hooks/useIncidents";
import { useAccessibilityNeeds } from "@/hooks/useAccessibilityNeeds";

// Types
import type { UserRole } from "@/types/fan";
import type { SafetyBroadcastEvent } from "@/types/events";
import type { Incident } from "@/types/incidents";

// ============================================================
// ROLE CONFIG
// ============================================================

const ROLE_LABELS: Record<NonNullable<UserRole>, string> = {
  fan:       "Fan Portal",
  organizer: "Command Center",
  volunteer: "Volunteer",
};

// ============================================================
// SKELETON FALLBACK
// ============================================================

function ViewLoadingFallback(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-[50vh]" aria-label="Loading view..." aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--brand-gold)] border-t-transparent animate-spin" aria-hidden="true" />
        <p className="text-xs text-[var(--text-tertiary)]">Loading…</p>
      </div>
    </div>
  );
}

// ============================================================
// ROLE SWITCHER DROPDOWN
// ============================================================

interface RoleSwitcherProps {
  readonly currentRole: NonNullable<UserRole>;
  readonly onSwitchRole: (role: NonNullable<UserRole>) => void;
}

function RoleSwitcher({ currentRole, onSwitchRole }: RoleSwitcherProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const roles: NonNullable<UserRole>[] = ["fan", "organizer", "volunteer"];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--border-strong)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Switch role. Current role: ${ROLE_LABELS[currentRole]}`}
      >
        {ROLE_LABELS[currentRole]}
        <ChevronDown className={clsx("w-3.5 h-3.5 transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-[var(--border-subtle)] glass-strong shadow-lg z-50 overflow-hidden animate-fade-in"
          role="listbox"
          aria-label="Select role"
        >
          {roles.map((role) => (
            <button
              key={role}
              role="option"
              aria-selected={currentRole === role}
              onClick={() => { onSwitchRole(role); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                currentRole === role
                  ? "text-[var(--brand-gold)] bg-[var(--brand-gold)]/10"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]"
              }`}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
          <div className="border-t border-[var(--border-subtle)]">
            <button
              onClick={() => { onSwitchRole(currentRole); setIsOpen(false); }}
              className="w-full text-left px-4 py-2.5 text-xs text-[var(--text-tertiary)] hover:bg-[var(--bg-elevated)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
              aria-label="Return to role selection screen"
            >
              ← Back to Role Select
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export function App(): React.JSX.Element {
  // --- Role state ---
  const [role, setRole] = useState<UserRole>(null);
  const [transitionActive, setTransitionActive] = useState(false);

  // --- Theme ---
  const { theme, accessibilityMode, toggleTheme, toggleAccessibilityMode } = useTheme("dark");

  // --- Shared state ---
  const ecoHook            = useEcoPoints();
  const incidentHook       = useIncidents();
  const { registeredNeeds, registerNeed } = useAccessibilityNeeds();

  // --- Safety broadcast state ---
  const [currentBroadcast, setCurrentBroadcast] = useState<SafetyBroadcastEvent | null>(null);

  // --- WebSocket ---
  useWebSocket({
    onSafetyBroadcast: useCallback((event: SafetyBroadcastEvent) => {
      setCurrentBroadcast(event);
    }, []),
    onIncidentCreated: useCallback((event: any) => {
      incidentHook.dispatch({
        type: "ADD_INCIDENT",
        payload: {
          ...event.incident,
          updatedAt: event.incident.createdAt,
        } as Incident,
      });
    }, [incidentHook]),
    broadcastIntervalMs: 45000,
    incidentIntervalMs:  75000,
  });

  const handleSelectRole = useCallback((selectedRole: NonNullable<UserRole>): void => {
    setTransitionActive(true);
    setRole(selectedRole);
  }, []);

  const handleSwitchRole = useCallback((newRole: NonNullable<UserRole>): void => {
    setTransitionActive(true);
    setRole(newRole);
  }, []);

  const handleBackToSelection = useCallback((): void => {
    setTransitionActive(true);
    setRole(null);
  }, []);

  // ── ONBOARDING ───────────────────────────────────────────
  if (role === null) {
    return (
      <div data-theme={theme}>
        <OfflineBanner />
        <BallRoll active={transitionActive} onComplete={() => setTransitionActive(false)} />
        <RoleSelectionPage onSelectRole={handleSelectRole} />
      </div>
    );
  }

  // ── APP SHELL + ROLE VIEWS ────────────────────────────────
  return (
    <div
      data-theme={theme}
      className="flex flex-col min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]"
    >
      <OfflineBanner />
      
      {/* Page Switch Ball Roll transition overlay */}
      <BallRoll active={transitionActive} onComplete={() => setTransitionActive(false)} />

      {/* Safety Banner */}
      <SafetyBanner
        broadcast={currentBroadcast}
        onDismiss={() => setCurrentBroadcast(null)}
      />

      {/* App Header */}
      <header className="sticky top-0 z-30 glass-strong border-b border-[var(--border-subtle)] shrink-0 flex flex-col">
        <div className="flex items-center justify-between h-14 px-4 w-full max-w-7xl mx-auto">
          {/* Logo */}
          <button
            onClick={handleBackToSelection}
            className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
            aria-label="StadiumIQ — return to role selection"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--brand-gold)] flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-black" aria-hidden="true" />
            </div>
            <span className="font-display font-black text-base text-[var(--text-primary)] hidden sm:inline">
              Stadium<span className="text-[var(--brand-gold)]">IQ</span>
            </span>
            <span className="text-[10px] text-[var(--text-tertiary)] hidden sm:inline">FIFA WC 2026</span>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {/* 4. Score Bug (Pulsing live match info) */}
            <ScoreBug />

            {/* Role Switcher */}
            <RoleSwitcher
              currentRole={role as NonNullable<UserRole>}
              onSwitchRole={handleSwitchRole}
            />

            {/* Accessibility Toggle */}
            <button
              onClick={toggleAccessibilityMode}
              className={clsx(
                "p-2 rounded-lg border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]",
                accessibilityMode === "high-contrast"
                  ? "border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/10 text-[var(--brand-gold)]"
                  : "border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)]"
              )}
              aria-pressed={accessibilityMode === "high-contrast"}
              aria-label={accessibilityMode === "high-contrast" ? "Disable high-contrast mode" : "Enable high-contrast accessibility mode"}
              title="Toggle accessibility mode"
            >
              <Accessibility className="w-4 h-4" aria-hidden="true" />
            </button>

            {/* Dark/Light Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border-subtle)] text-[var(--text-tertiary)] hover:border-[var(--border-strong)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark"
                ? <Sun  className="w-4 h-4" aria-hidden="true" />
                : <Moon className="w-4 h-4" aria-hidden="true" />
              }
            </button>
          </div>
        </div>

        {/* 10. Global Ticker Strip */}
        <StadiumTicker />
      </header>

      {/* Main Content — Role Views */}
      <main className="flex-1 overflow-hidden flex flex-col" id="main-content">
        <Suspense fallback={<ViewLoadingFallback />}>
          <ErrorBoundary viewName={ROLE_LABELS[role as NonNullable<UserRole>]}>
            {role === "fan" && (
              <FanPortal
                ecoHook={ecoHook}
                registeredNeeds={registeredNeeds}
                onRegisterAccessibilityNeeds={registerNeed}
              />
            )}
            {role === "organizer" && (
              <CommandCenter incidentHook={incidentHook} />
            )}
            {role === "volunteer" && (
              <VolunteerPortal
                incidentHook={incidentHook}
                registeredNeeds={registeredNeeds}
              />
            )}
          </ErrorBoundary>
        </Suspense>
      </main>

      {/* Skip to main content (accessibility) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--brand-gold)] focus:text-black focus:font-bold focus:rounded-lg focus:text-sm"
      >
        Skip to main content
      </a>
    </div>
  );
}
