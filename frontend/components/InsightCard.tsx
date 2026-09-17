import { Sparkles, TriangleAlert, CircleCheck } from "lucide-react";
import type { Insight } from "@/lib/types";
import { cn } from "@/lib/utils";

const kindStyles: Record<Insight["kind"], { icon: typeof Sparkles; className: string }> = {
  positive: { icon: CircleCheck, className: "text-status-savings" },
  warning: { icon: TriangleAlert, className: "text-status-warning" },
  neutral: { icon: Sparkles, className: "text-accent-indigo" },
};

export function InsightCard({ insight }: { insight: Insight }) {
  const { icon: Icon, className } = kindStyles[insight.kind];
  return (
    <div className="rounded border border-base-border bg-white/[0.02] p-3.5 flex gap-3">
      <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", className)} />
      <div>
        <p className="text-sm font-medium text-ink-primary">{insight.title}</p>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          {insight.explanation}
        </p>
      </div>
    </div>
  );
}
