import type { ReactNode } from "react";

export function ChartCard({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-card border border-base-border bg-base-surface/70 p-4 sm:p-5 shadow-card hover:border-base-border-hover transition-colors ${className ?? ""}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
          {description && (
            <p className="text-xs text-ink-muted mt-0.5">{description}</p>
          )}
        </div>
        {actions}
      </div>
      <div className="overflow-x-auto scrollbar-thin">{children}</div>
    </div>
  );
}
