import React from "react";
import clsx from "clsx";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  headerAction?: React.ReactNode;
  isHoverable?: boolean;
}

export default function Card({
  children,
  title,
  headerAction,
  isHoverable = true,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={clsx(
        "glass-panel rounded-md overflow-hidden",
        isHoverable && "glass-panel-hover",
        className,
      )}
      role="region"
      aria-label={title || "Dashboard Panel"}
      {...props}
    >
      {title && (
        <div className="px-6 py-4.5 border-b border-border-subtle/50 flex justify-between items-center bg-bg-surface/20">
          <h3 className="font-outfit font-semibold text-sm tracking-wide text-text-primary uppercase">
            {title}
          </h3>
          {headerAction && (
            <div className="flex items-center">{headerAction}</div>
          )}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
}
