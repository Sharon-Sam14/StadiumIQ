import React from "react";
import { Ticket, MapPin, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

// ============================================================
// TICKET TAB — Digital match ticket display
// ============================================================

export const TicketTab = React.memo(function TicketTab(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in px-2">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--brand-gold)]/25 bg-gradient-to-b from-[var(--brand-green-deep)]/30 to-[var(--bg-surface)] overflow-hidden shadow-xl">
        {/* Ticket Header */}
        <div className="px-6 pt-6 pb-4 border-b border-dashed border-[var(--border-strong)]">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--brand-gold)] bg-[var(--brand-gold)]/10 px-2 py-0.5 rounded-full border border-[var(--brand-gold)]/20">
                FIFA World Cup 2026™
              </span>
              <h2 className="font-display font-black text-2xl text-[var(--text-primary)] mt-2">
                ROUND OF 16
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                <Calendar className="w-3 h-3" aria-hidden="true" />
                Match 82 — MetLife Stadium, NJ
              </p>
            </div>
            <Ticket className="w-8 h-8 text-[var(--brand-gold)]" aria-hidden="true" />
          </div>
        </div>

        {/* QR Code Area */}
        <div className="flex items-center justify-center py-6 px-6 border-b border-dashed border-[var(--border-strong)]">
          <div className="w-44 h-44 bg-white rounded-xl flex items-center justify-center p-3" aria-label="Ticket QR code (mock)">
            {/* Simulated QR code pattern */}
            <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
              {/* QR code module simulation */}
              {[0,1,2,3,4,5,6].map((row) =>
                [0,1,2,3,4,5,6].map((col) => (
                  <rect
                    key={`${row}-${col}`}
                    x={col * 14 + 1}
                    y={row * 14 + 1}
                    width="12"
                    height="12"
                    fill={Math.random() > 0.4 ? "#000" : "#fff"}
                    rx="1"
                  />
                ))
              )}
              {/* Finder patterns */}
              <rect x="1" y="1" width="28" height="28" fill="none" stroke="#000" strokeWidth="3" rx="2" />
              <rect x="72" y="1" width="28" height="28" fill="none" stroke="#000" strokeWidth="3" rx="2" />
              <rect x="1" y="72" width="28" height="28" fill="none" stroke="#000" strokeWidth="3" rx="2" />
              <rect x="8" y="8" width="14" height="14" fill="#000" rx="1" />
              <rect x="79" y="8" width="14" height="14" fill="#000" rx="1" />
              <rect x="8" y="79" width="14" height="14" fill="#000" rx="1" />
            </svg>
          </div>
        </div>

        {/* Seat Info Grid */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-4 h-4 text-[var(--brand-gold)]" aria-hidden="true" />
            <span className="font-display font-bold text-base text-[var(--text-primary)]">Carlos Mendes</span>
            <Badge variant="success" size="xs">Verified</Badge>
          </div>

          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "Section", value: "212" },
              { label: "Row",     value: "12" },
              { label: "Seat",    value: "4" },
              { label: "Gate",    value: "B" },
            ].map(({ label, value }) => (
              <div key={label} className="text-center bg-[var(--bg-elevated)] rounded-lg py-2.5">
                <p className="text-[9px] text-[var(--text-tertiary)] uppercase font-semibold">{label}</p>
                <p className="font-display font-bold text-lg text-[var(--text-primary)] mt-0.5">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
            <MapPin className="w-3.5 h-3.5 text-green-400 shrink-0" aria-hidden="true" />
            <p className="text-[10px] text-[var(--text-secondary)]">
              Enter via <strong className="text-green-400">Gate B</strong> (recommended, low congestion). Follow gold wayfinding markers to Section 212.
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-[var(--text-tertiary)] mt-4 text-center max-w-xs">
        Scan this QR code at the turnstile. Keep screen brightness high for best scan results.
      </p>
    </div>
  );
});
