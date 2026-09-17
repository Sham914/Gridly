"use client";

import { useState, type ReactNode } from "react";
import { HelpCircle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  trend?: { value: string; positive: boolean };
  icon?: ReactNode;
  accent?: "gold" | "savings" | "warning" | "critical" | "indigo";
}

const accentMap = {
  gold: "text-accent-gold",
  savings: "text-status-savings",
  warning: "text-status-warning",
  critical: "text-status-critical",
  indigo: "text-accent-indigo",
};

export function MetricCard({
  label,
  value,
  hint,
  trend,
  icon,
  accent = "gold",
}: MetricCardProps) {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="rounded-card border border-base-border bg-base-surface/70 p-4 hover:border-base-border-hover transition-colors shadow-card relative">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono uppercase tracking-wide text-ink-muted">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {icon && <span className={accentMap[accent]}>{icon}</span>}
          {hint && (
            <button
              type="button"
              aria-label={`About ${label}`}
              onMouseEnter={() => setShowHint(true)}
              onMouseLeave={() => setShowHint(false)}
              onFocus={() => setShowHint(true)}
              onBlur={() => setShowHint(false)}
              className="focus-ring text-ink-muted hover:text-ink-primary"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <p className="mt-2 text-2xl font-semibold text-ink-primary tracking-tight">
        {value}
      </p>

      {trend && (
        <div
          className={cn(
            "mt-1.5 inline-flex items-center gap-1 text-xs font-mono",
            trend.positive ? "text-status-savings" : "text-status-warning",
          )}
        >
          {trend.positive ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          {trend.value}
        </div>
      )}

      {hint && showHint && (
        <div className="absolute z-20 left-4 top-full mt-2 w-56 rounded border border-base-border bg-base-950 p-2.5 text-xs text-ink-secondary shadow-glow">
          {hint}
        </div>
      )}
    </div>
  );
}
