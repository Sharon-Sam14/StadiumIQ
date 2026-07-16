import React from "react";
import { clsx } from "clsx";

// ============================================================
// CARD COMPONENT
// ============================================================

interface CardProps {
  readonly children: React.ReactNode;
  readonly title?: string;
  readonly subtitle?: string;
  readonly headerRight?: React.ReactNode;
  readonly className?: string;
  readonly noPadding?: boolean;
  readonly glass?: boolean;
  readonly hoverable?: boolean;
  readonly as?: "div" | "article" | "section";
}

export const Card = React.memo(function Card({
  children,
  title,
  subtitle,
  headerRight,
  className,
  noPadding = false,
  glass = true,
  hoverable = false,
  as: Tag = "div",
}: CardProps): React.JSX.Element {
  return (
    <Tag
      className={clsx(
        "rounded-xl border overflow-hidden",
        glass ? "glass" : "bg-[var(--bg-surface)]",
        "border-[var(--border-subtle)]",
        hoverable &&
          "transition-all duration-200 hover:border-[var(--border-strong)] hover:-translate-y-0.5",
        className,
      )}
    >
      {(title || headerRight) && (
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            {title && (
              <h3 className="font-display font-bold text-sm tracking-wide text-[var(--text-primary)] uppercase">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {headerRight && (
            <div className="flex items-center gap-2">{headerRight}</div>
          )}
        </div>
      )}
      <div className={clsx(!noPadding && "p-5")}>{children}</div>
    </Tag>
  );
});
