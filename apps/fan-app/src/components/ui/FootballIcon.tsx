import React from "react";

// ============================================================
// FOOTBALL SVG ICON
// Decorative football icon utilizing inline shapes and paths.
// WCAG Rule: always marked as aria-hidden="true" (decorative).
// ============================================================

interface FootballIconProps {
  readonly className?: string;
  readonly size?: number;
}

export const FootballIcon = React.memo(function FootballIcon({
  className = "w-5 h-5",
  size = 24,
}: FootballIconProps): React.JSX.Element {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      role="presentation"
    >
      <circle cx="12" cy="12" r="10" fill="#f3f6fa" stroke="#1a1a1a" />
      <polygon
        points="12,8.2 15.3,10.7 14,14.7 10,14.7 8.7,10.7"
        fill="#1a1a1a"
        stroke="#1a1a1a"
      />
      <line x1="12" y1="8.2" x2="12" y2="2" stroke="#1a1a1a" />
      <line x1="15.3" y1="10.7" x2="20.5" y2="8.5" stroke="#1a1a1a" />
      <line x1="14" y1="14.7" x2="18" y2="21" stroke="#1a1a1a" />
      <line x1="10" y1="14.7" x2="6" y2="21" stroke="#1a1a1a" />
      <line x1="8.7" y1="10.7" x2="3.5" y2="8.5" stroke="#1a1a1a" />
    </svg>
  );
});
