import React, { useState } from "react";
import { Users, BarChart3, ClipboardList, Trophy, Zap, Shield } from "lucide-react";
import { FootballBackground } from "@/components/animations/FootballBackground";
import { FootballIcon } from "@/components/ui/FootballIcon";
import type { UserRole } from "@/types/fan";

// ============================================================
// ROLE SELECTION LANDING PAGE — Hero pitch background + hover ball
// ============================================================

interface RoleCard {
  readonly role: NonNullable<UserRole>;
  readonly label: string;
  readonly description: string;
  readonly icon: React.JSX.Element;
  readonly accent: string;
  readonly highlights: readonly string[];
}

const ROLE_CARDS: readonly RoleCard[] = [
  {
    role: "fan",
    label: "Fan",
    description: "Your game-day companion for navigation, AI assistance, and eco rewards",
    icon: <Trophy className="w-8 h-8" aria-hidden="true" />,
    accent: "from-emerald-500/20 to-green-600/10 border-emerald-500/30",
    highlights: ["Indoor BLE Navigation", "AI Concierge (50+ Languages)", "Eco Earn & Rewards"],
  },
  {
    role: "organizer",
    label: "Command Center",
    description: "Mission-critical dashboard for real-time crowd intelligence and operations control",
    icon: <BarChart3 className="w-8 h-8" aria-hidden="true" />,
    accent: "from-blue-500/20 to-indigo-600/10 border-blue-500/30",
    highlights: ["Predictive Surge Forecasting", "AI Operations Advisor", "Live Incident Queue"],
  },
  {
    role: "volunteer",
    label: "Volunteer",
    description: "Your shift briefing, task board, and standard operating procedures assistant",
    icon: <ClipboardList className="w-8 h-8" aria-hidden="true" />,
    accent: "from-amber-500/20 to-yellow-600/10 border-amber-500/30",
    highlights: ["AI Shift Briefing", "Task Management", "SOP Chat Assistant"],
  },
] as const;

interface RoleSelectionPageProps {
  readonly onSelectRole: (role: NonNullable<UserRole>) => void;
}

export function RoleSelectionPage({ onSelectRole }: RoleSelectionPageProps): React.JSX.Element {
  const [hoveredRole, setHoveredRole] = useState<UserRole>(null);

  return (
    <div className="min-h-screen bg-[#070b16] flex flex-col relative overflow-hidden">
      {/* 1. Football pitch schematic & floating balls */}
      <FootballBackground />

      {/* Hero Header */}
      <header className="relative pt-16 pb-12 px-6 text-center overflow-hidden z-10">
        {/* FIFA badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--brand-gold)]/30 bg-[var(--brand-gold)]/10 mb-6">
          <Shield className="w-3.5 h-3.5 text-[var(--brand-gold)]" aria-hidden="true" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-[var(--brand-gold)]">
            FIFA World Cup 2026
          </span>
        </div>

        <h1 className="font-display font-black text-4xl md:text-6xl text-[var(--text-primary)] leading-tight mb-4">
          Stadium<span className="text-[var(--brand-gold)]">IQ</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          GenAI-powered unified operations and fan experience platform.
          <br />
          <span className="text-[var(--text-tertiary)] text-sm">MetLife Stadium — East Rutherford, NJ</span>
        </p>

        {/* Live indicator */}
        <div className="inline-flex items-center gap-2 mt-6 px-3 py-1.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <span className="w-2 h-2 rounded-full bg-[#00a651] animate-pulse" aria-hidden="true" />
          <span className="text-[11px] text-[var(--text-secondary)] font-medium">
            Match 82 — Live Now
          </span>
        </div>
      </header>

      {/* Role Cards */}
      <main className="flex-1 px-6 pb-16 z-10">
        <h2 className="text-center text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-widest mb-8">
          Select your role to continue
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {ROLE_CARDS.map((card) => (
            <article
              key={card.role}
              onMouseEnter={() => setHoveredRole(card.role)}
              onMouseLeave={() => setHoveredRole(null)}
              className={`relative rounded-2xl border bg-gradient-to-br ${card.accent} p-6 flex flex-col gap-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl cursor-default`}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-[var(--bg-base)]/50 border border-[var(--border-subtle)] flex items-center justify-center text-[var(--brand-gold)]">
                {card.icon}
              </div>

              {/* Text */}
              <div>
                <h3 className="font-display font-black text-xl text-[var(--text-primary)] mb-1">
                  {card.label}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {card.description}
                </p>
              </div>

              {/* Feature highlights */}
              <ul className="space-y-1.5 flex-1" aria-label={`${card.label} features`}>
                {card.highlights.map((highlight) => (
                  <li key={highlight} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                    <Zap className="w-3 h-3 text-[var(--brand-gold)] shrink-0" aria-hidden="true" />
                    {highlight}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => onSelectRole(card.role)}
                className="w-full py-3 rounded-xl bg-[var(--brand-gold)] text-black font-display font-bold text-sm tracking-wide transition-all duration-150 hover:opacity-90 hover:scale-[1.01] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-gold)]"
                aria-label={`Enter as ${card.label}`}
              >
                Enter as {card.label}
              </button>

              {/* 2. Role Card Hover Ball Bounce */}
              {hoveredRole === card.role && (
                <div
                  className="absolute bottom-4 right-4 animate-card-bounce"
                  style={{ willChange: "transform" }}
                >
                  <FootballIcon size={20} />
                </div>
              )}
            </article>
          ))}
        </div>

        {/* Footer note */}
        <div className="flex items-center justify-center gap-3 mt-10 text-[var(--text-tertiary)] text-xs">
          <Users className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            You can switch roles at any time using the role switcher in the top navigation.
          </span>
        </div>
      </main>
    </div>
  );
}
