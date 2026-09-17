"use client";

import { toast } from "sonner";
import { Download, FileText } from "lucide-react";
import { Header } from "@/components/Header";
import { ChartCard } from "@/components/ChartCard";
import {
  kpis,
  forecastSummary,
  anomalies,
  recommendations,
} from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";

export default function ReportsPage() {
  return (
    <div>
      <Header title="Reports" subtitle="Monthly energy report preview" showControls={false} />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="rounded-card border border-base-border bg-base-surface/70 p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-accent-gold" />
              <div>
                <h2 className="font-semibold text-ink-primary">
                  Monthly Energy Report — September 2026
                </h2>
                <p className="text-xs text-ink-muted">Main Campus Building</p>
              </div>
            </div>
            <button
              onClick={() =>
                toast("Report generation will be available in the production version.")
              }
              className="focus-ring inline-flex items-center gap-2 rounded bg-accent-gold px-4 py-2 text-sm font-medium text-base-950 hover:bg-accent-gold/90 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
          </div>

          <ReportSection title="Summary Statistics">
            <ReportRow label="Total consumption" value={`${kpis.totalConsumptionKwh} kWh`} />
            <ReportRow label="Estimated cost" value={formatINR(kpis.estimatedCostInr)} />
            <ReportRow label="Monthly change" value={`+${kpis.monthlyChangePct}%`} />
            <ReportRow label="Peak demand" value={kpis.peakDemandTime} />
          </ReportSection>

          <ReportSection title="Forecast Summary">
            <ReportRow label="Predicted weekly usage" value={`${forecastSummary.predictedWeeklyKwh} kWh`} />
            <ReportRow label="Predicted weekly cost" value={formatINR(forecastSummary.predictedWeeklyCostInr)} />
            <ReportRow label="Expected peak" value={forecastSummary.expectedPeak} />
            <ReportRow label="Budget overrun risk" value={forecastSummary.budgetOverrunRisk} />
          </ReportSection>

          <ReportSection title="Detected Anomalies">
            {anomalies.map((a) => (
              <ReportRow
                key={a.id}
                label={a.type}
                value={`${a.severity} · ${formatINR(a.costImpactInr)} impact`}
              />
            ))}
          </ReportSection>

          <ReportSection title="Recommendations & Estimated Savings" last>
            {recommendations.map((r) => (
              <ReportRow
                key={r.id}
                label={r.title}
                value={`${formatINR(r.savingsInrRange[0])}–${formatINR(r.savingsInrRange[1])}/mo`}
              />
            ))}
          </ReportSection>
        </div>
      </div>
    </div>
  );
}

function ReportSection({
  title,
  children,
  last,
}: {
  title: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div className={`pb-5 mb-5 ${last ? "" : "border-b border-base-border"}`}>
      <h3 className="text-xs font-mono uppercase text-ink-muted mb-2.5">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function ReportRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm gap-4">
      <span className="text-ink-secondary">{label}</span>
      <span className="text-ink-primary font-medium text-right">{value}</span>
    </div>
  );
}
