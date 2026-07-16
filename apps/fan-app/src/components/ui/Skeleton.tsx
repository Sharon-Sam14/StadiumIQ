import React from "react";
import { clsx } from "clsx";
import { BallBounceLoader } from "@/components/animations/BallBounceLoader";

// ============================================================
// SKELETON LOADER COMPONENTS
// ============================================================

interface SkeletonProps {
  readonly className?: string;
  readonly "aria-label"?: string;
}

export const Skeleton = React.memo(function Skeleton({
  className,
  "aria-label": ariaLabel = "Loading...",
}: SkeletonProps): React.JSX.Element {
  return (
    <div
      className={clsx("skeleton", className)}
      role="status"
      aria-label={ariaLabel}
      aria-busy="true"
    />
  );
});

// ============================================================
// SKELETON CARD — Simulates a data card placeholder
// ============================================================

interface SkeletonCardProps {
  readonly lines?: number;
  readonly showHeader?: boolean;
  readonly className?: string;
}

export const SkeletonCard = React.memo(function SkeletonCard({
  lines = 3,
  showHeader = true,
  className,
}: SkeletonCardProps): React.JSX.Element {
  return (
    <div
      className={clsx(
        "rounded-xl border p-5 space-y-3",
        "bg-[var(--bg-surface)] border-[var(--border-subtle)]",
        className,
      )}
      role="status"
      aria-label="Loading content..."
      aria-busy="true"
    >
      {showHeader && (
        <div className="flex items-center justify-between h-5">
          <Skeleton className="h-3 w-28 rounded" />
          <BallBounceLoader />
        </div>
      )}
      <Skeleton className="h-8 w-20 rounded mt-1" />
      <div className="space-y-2 pt-1">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={clsx(
              "h-2.5 rounded",
              i === lines - 1 ? "w-3/5" : "w-full",
            )}
          />
        ))}
      </div>
    </div>
  );
});

// ============================================================
// SKELETON TABLE ROW
// ============================================================

interface SkeletonTableRowProps {
  readonly columns?: number;
}

export const SkeletonTableRow = React.memo(function SkeletonTableRow({
  columns = 5,
}: SkeletonTableRowProps): React.JSX.Element {
  return (
    <tr role="status" aria-label="Loading row...">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton
            className={clsx(
              "h-3 rounded",
              i === 0 ? "w-16" : i === 1 ? "w-full" : "w-14",
            )}
          />
        </td>
      ))}
    </tr>
  );
});

// ============================================================
// LOADING DOTS — Inline loading indicator
// ============================================================

export function LoadingDots(): React.JSX.Element {
  return (
    <span
      className="inline-flex gap-1 items-center"
      aria-label="Loading"
      aria-busy="true"
    >
      <span className="loading-dot" />
      <span className="loading-dot" />
      <span className="loading-dot" />
    </span>
  );
}
