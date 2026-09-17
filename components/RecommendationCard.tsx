"use client";

import { Check, X, Gauge, IndianRupee, Zap } from "lucide-react";
import type { Recommendation } from "@/lib/types";
import { cn, formatINR } from "@/lib/utils";

const effortDots: Record<Recommendation["effort"], number> = {
  Low: 1,
  Medium: 2,
  High: 3,
};

export function RecommendationCard({
  rec,
  onComplete,
  onDismiss,
}: {
  rec: Recommendation;
  onComplete: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  const isDone = rec.status !== "Pending";

  return (
    <div
      className={cn(
        "rounded-card border bg-base-surface/70 p-4 sm:p-5 transition-colors",
        rec.status === "Completed" && "border-status-savings/30 opacity-80",
        rec.status === "Dismissed" && "border-white/10 opacity-50",
        rec.status === "Pending" && "border-base-border hover:border-base-border-hover",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent-gold/15 text-accent-gold text-xs font-mono">
            {rec.priority}
          </span>
          <h3 className="text-sm font-semibold text-ink-primary">{rec.title}</h3>
        </div>
        {rec.status !== "Pending" && (
          <span className="text-xs font-mono text-ink-muted">{rec.status}</span>
        )}
      </div>

      <p className="text-sm text-ink-muted mt-2 leading-relaxed">{rec.reason}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <Stat
          icon={<Zap className="h-3.5 w-3.5" />}
          label="Savings"
          value={`${rec.savingsKwhRange[0]}–${rec.savingsKwhRange[1]} kWh/wk`}
        />
        <Stat
          icon={<IndianRupee className="h-3.5 w-3.5" />}
          label="Monthly"
          value={`${formatINR(rec.savingsInrRange[0])}–${formatINR(rec.savingsInrRange[1])}`}
        />
        <Stat
          icon={<Gauge className="h-3.5 w-3.5" />}
          label="Effort"
          value={rec.effort}
          dots={effortDots[rec.effort]}
        />
        <Stat label="Confidence" value={rec.confidence} />
      </div>

      {!isDone && (
        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={() => onComplete(rec.id)}
            className="focus-ring inline-flex items-center gap-1.5 rounded border border-status-savings/30 bg-status-savings/10 px-3 py-1.5 text-xs font-medium text-status-savings hover:bg-status-savings/20 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            Mark as completed
          </button>
          <button
            onClick={() => onDismiss(rec.id)}
            className="focus-ring inline-flex items-center gap-1.5 rounded border border-base-border px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink-primary hover:border-white/20 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  dots,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  dots?: number;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[11px] font-mono uppercase text-ink-muted">
        {icon}
        {label}
      </div>
      <div className="text-sm text-ink-primary mt-0.5 flex items-center gap-1">
        {value}
        {dots && (
          <span className="flex gap-0.5 ml-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  i < dots ? "bg-accent-gold" : "bg-white/10",
                )}
              />
            ))}
          </span>
        )}
      </div>
    </div>
  );
}
