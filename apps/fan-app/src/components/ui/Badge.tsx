import React from "react";
import { clsx } from "clsx";

// ============================================================
// BADGE COMPONENT
// WCAG rule: color is NEVER the sole indicator — always includes text label.
// ============================================================

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "gold" | "neutral";

interface BadgeProps {
  readonly variant: BadgeVariant;
  readonly children: React.ReactNode;
  readonly size?: "xs" | "sm";
  readonly className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger:  "badge-danger",
  info:    "badge-info",
  gold:    "badge-gold",
  neutral: "badge-neutral",
};

export const Badge = React.memo(function Badge({
  variant,
  children,
  size = "sm",
  className,
}: BadgeProps): React.JSX.Element {
  return (
    <span
      className={clsx(
        "inline-flex items-center font-bold tracking-wider rounded-full",
        size === "xs" ? "text-[9px] px-2 py-0.5" : "text-[10px] px-2.5 py-1",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
});

// Severity badge — maps IncidentSeverity to BadgeVariant
export type SeverityLevel = "low" | "medium" | "high" | "critical";

const SEVERITY_VARIANT_MAP: Record<SeverityLevel, BadgeVariant> = {
  low:      "success",
  medium:   "warning",
  high:     "danger",
  critical: "danger",
};

const SEVERITY_LABEL_MAP: Record<SeverityLevel, string> = {
  low:      "Low",
  medium:   "Medium",
  high:     "High",
  critical: "Critical",
};

interface SeverityBadgeProps {
  readonly severity: SeverityLevel;
  readonly className?: string;
}

export const SeverityBadge = React.memo(function SeverityBadge({
  severity,
  className,
}: SeverityBadgeProps): React.JSX.Element {
  return (
    <Badge variant={SEVERITY_VARIANT_MAP[severity]} size="xs" className={className}>
      {SEVERITY_LABEL_MAP[severity]}
    </Badge>
  );
});

// Status badge
export type StatusLevel = "active" | "assigned" | "resolved" | "pending" | "in_progress" | "completed" | "cancelled";

const STATUS_VARIANT_MAP: Record<StatusLevel, BadgeVariant> = {
  active:      "danger",
  assigned:    "warning",
  resolved:    "success",
  pending:     "neutral",
  in_progress: "info",
  completed:   "success",
  cancelled:   "neutral",
};

const STATUS_LABEL_MAP: Record<StatusLevel, string> = {
  active:      "Active",
  assigned:    "Assigned",
  resolved:    "Resolved",
  pending:     "Pending",
  in_progress: "In Progress",
  completed:   "Completed",
  cancelled:   "Cancelled",
};

interface StatusBadgeProps {
  readonly status: StatusLevel;
  readonly className?: string;
}

export const StatusBadge = React.memo(function StatusBadge({
  status,
  className,
}: StatusBadgeProps): React.JSX.Element {
  return (
    <Badge variant={STATUS_VARIANT_MAP[status]} size="xs" className={className}>
      {STATUS_LABEL_MAP[status]}
    </Badge>
  );
});

// AI Badge — labels all AI-generated features
export function AIBadge({ label = "AI-Generated" }: { label?: string }): React.JSX.Element {
  return (
    <span className="ai-badge" aria-label={`${label} — powered by GenAI`}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2L13.09 8.26L19 9L13.09 9.74L12 16L10.91 9.74L5 9L10.91 8.26L12 2Z" />
      </svg>
      {label}
    </span>
  );
}
