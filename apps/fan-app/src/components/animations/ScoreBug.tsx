import React from "react";

// ============================================================
// 4. SCORE BUG — Animated Score Header Widget
// Shows pulsing LIVE dot and simplified rectangle country flags.
// ============================================================

export const ScoreBug = React.memo(function ScoreBug(): React.JSX.Element {
  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#0e162b] border border-[var(--border-strong)] text-[11px] font-bold text-white shrink-0"
      aria-label="Live match score bug: USA 2, Mexico 1"
    >
      {/* Pulse Dot */}
      <span className="flex h-2 w-2 relative" aria-hidden="true">
        <span className="animate-live-pulse absolute inline-flex h-full w-full rounded-full bg-[#e53e3e]" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#e53e3e]" />
      </span>

      <span className="text-[9px] uppercase tracking-wider text-red-500 mr-0.5">
        LIVE
      </span>

      {/* Flag USA */}
      <span className="flex items-center gap-1">
        <span
          className="w-3.5 h-2.5 inline-flex items-center justify-center text-[7px] text-white font-black rounded-xs select-none"
          style={{
            background:
              "linear-gradient(90deg, #3c3b6e 40%, #ffffff 40%, #b22234 40%)",
          }}
          aria-hidden="true"
        >
          US
        </span>
        <span className="text-[10px] text-slate-200">USA</span>
      </span>

      {/* Score */}
      <span className="font-mono text-xs text-[var(--brand-gold)] px-0.5">
        2 — 1
      </span>

      {/* Flag MEX */}
      <span className="flex items-center gap-1">
        <span className="text-[10px] text-slate-200">MEX</span>
        <span
          className="w-3.5 h-2.5 inline-flex items-center justify-center text-[7px] text-white font-black rounded-xs select-none"
          style={{
            background:
              "linear-gradient(90deg, #006847 33%, #ffffff 33%, #ffffff 66%, #c8102e 66%)",
          }}
          aria-hidden="true"
        >
          MX
        </span>
      </span>
    </div>
  );
});
