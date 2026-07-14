import React from "react";

// ============================================================
// 10. GLOBAL HEADER — Stadium Scrolling News Ticker
// Visible in all role views. Marquee pauses on user hover.
// ============================================================

const TICKER_MESSAGES = [
  "FIFA World Cup 2026 — MetLife Stadium, East Rutherford, NJ",
  "Match 82 | Group Stage | Gate B now open — reduced wait time 2.4 min",
  "Eco Impact: 1,240 kg waste diverted today — thank you fans",
  "AI Surge Forecast: Section 200 at 94% — volunteers dispatched",
  "Shuttle Service: Platform 3 departing in 8 min — Gate C exit recommended",
];

export const StadiumTicker = React.memo(function StadiumTicker(): React.JSX.Element {
  // Join messages with separator circles
  const scrollingText = TICKER_MESSAGES.join("  •  ");

  return (
    <div
      className="w-full h-7 bg-[#070b16] border-b border-[var(--border-subtle)] flex items-center overflow-hidden pointer-events-auto select-none"
      role="region"
      aria-label="Stadium News Ticker"
    >
      <div
        className="animate-ticker whitespace-nowrap text-[10px] font-semibold text-[#abc0d8] flex items-center select-none cursor-default"
        style={{
          paddingLeft: "10%",
          animationPlayState: "running",
          willChange: "transform",
        }}
      >
        <span>{scrollingText}</span>
        <span className="mx-8">•</span>
        <span>{scrollingText}</span>
      </div>
    </div>
  );
});
