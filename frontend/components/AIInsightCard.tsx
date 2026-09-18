import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function AIInsightCard({
  title,
  summary,
  isLoading = false,
}: {
  title: string;
  summary: string;
  isLoading?: boolean;
}) {
  return (
    <div className="rounded-card border border-base-border bg-white/[0.02] p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-primary">
        <Sparkles className="h-4 w-4 text-accent-gold" />
        {title}
      </div>
      <p className={cn("text-sm leading-relaxed text-ink-secondary", isLoading && "animate-pulse text-ink-muted")}>
        {summary}
      </p>
    </div>
  );
}
