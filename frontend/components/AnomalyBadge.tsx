import type { AnomalySeverity, AnomalyStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const severityStyles: Record<AnomalySeverity, string> = {
  Critical: "bg-status-critical/15 text-status-critical border-status-critical/30",
  High: "bg-status-warning/15 text-status-warning border-status-warning/30",
  Medium: "bg-accent-indigo/15 text-accent-indigo border-accent-indigo/30",
  Low: "bg-white/10 text-ink-secondary border-white/15",
};

const statusStyles: Record<AnomalyStatus, string> = {
  Open: "bg-status-critical/10 text-status-critical border-status-critical/25",
  Investigating: "bg-status-warning/10 text-status-warning border-status-warning/25",
  Resolved: "bg-status-savings/10 text-status-savings border-status-savings/25",
};

export function SeverityBadge({ severity }: { severity: AnomalySeverity }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono",
        severityStyles[severity],
      )}
    >
      {severity}
    </span>
  );
}

export function StatusBadge({ status }: { status: AnomalyStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-xs font-mono",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}
