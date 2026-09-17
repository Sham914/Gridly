"use client";

import { useState } from "react";
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Cpu, Gauge, Target, ShieldAlert } from "lucide-react";
import { Header } from "@/components/Header";
import { ChartCard } from "@/components/ChartCard";
import { MetricCard } from "@/components/MetricCard";
import { getForecast, forecastSummary } from "@/lib/mock-data";
import { formatINR, cn } from "@/lib/utils";

const chartAxisStyle = { fontSize: 11, fill: "#7C8A78" };
const HORIZONS = [
  { key: "24h", label: "24 Hours" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
] as const;
type HorizonKey = (typeof HORIZONS)[number]["key"];

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<HorizonKey>("7d");
  const data = getForecast(horizon).map((d) => ({
    ...d,
    band: [d.lowerBoundKwh, d.upperBoundKwh] as [number, number],
  }));

  return (
    <div>
      <Header title="Forecast" subtitle="Predicted demand for the days ahead" />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="inline-flex rounded border border-base-border bg-white/[0.03] p-1">
          {HORIZONS.map((h) => (
            <button
              key={h.key}
              onClick={() => setHorizon(h.key)}
              className={cn(
                "focus-ring rounded px-4 py-1.5 text-sm transition-colors",
                horizon === h.key
                  ? "bg-accent-gold text-base-950 font-medium"
                  : "text-ink-secondary hover:text-ink-primary",
              )}
            >
              {h.label}
            </button>
          ))}
        </div>

        <ChartCard
          title="Demand Forecast"
          description="History, prediction and confidence band"
        >
          <div className="h-80 min-w-[560px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="fcBand" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B87F6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#8B87F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(232,240,226,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={chartAxisStyle}
                  tickLine={false}
                  axisLine={false}
                  interval={horizon === "24h" ? 3 : horizon === "7d" ? 0 : 3}
                />
                <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<Tip />} />
                <Area dataKey="band" stroke="none" fill="url(#fcBand)" isAnimationActive={false} />
                <Line dataKey="actualKwh" stroke="#FBBF24" strokeWidth={2.25} dot={false} connectNulls />
                <Line
                  dataKey="predictedKwh"
                  stroke="#8B87F6"
                  strokeWidth={2}
                  strokeDasharray="6 5"
                  dot={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Predicted Weekly Usage"
            value={`${forecastSummary.predictedWeeklyKwh} kWh`}
            icon={<Gauge className="h-4 w-4" />}
          />
          <MetricCard
            label="Predicted Weekly Cost"
            value={formatINR(forecastSummary.predictedWeeklyCostInr)}
            icon={<Target className="h-4 w-4" />}
          />
          <MetricCard
            label="Expected Peak"
            value={forecastSummary.expectedPeak}
            accent="warning"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <MetricCard
            label="Budget Overrun Risk"
            value={forecastSummary.budgetOverrunRisk}
            accent="warning"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Model Information">
            <div className="space-y-3">
              <Row icon={<Cpu className="h-4 w-4 text-accent-indigo" />} label="Model" value={forecastSummary.model} />
              <Row label="Inputs" value={forecastSummary.inputs.join(", ")} />
              <Row label="Forecast MAE" value={`${forecastSummary.maeKwhPerHour} kWh/hour`} />
              <Row label="Confidence" value={`${forecastSummary.confidencePct}%`} />
            </div>
          </ChartCard>

          <ChartCard title="AI Forecast Explanation">
            <p className="text-sm text-ink-secondary leading-relaxed">
              Usage is trending upward by roughly {13.4}% against last
              month, driven mainly by longer afternoon cooling runs. The
              model expects the heaviest load of the week on Friday
              afternoon, between 2 PM and 4 PM, matching the pattern seen in
              recent weeks. The confidence band widens further out in the
              horizon — near-term hours are predicted within about{" "}
              {forecastSummary.maeKwhPerHour} kWh on average, while the
              30-day view carries more uncertainty from weather and
              occupancy changes.
            </p>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-base-border/60 pb-2.5 last:border-0 last:pb-0">
      <span className="flex items-center gap-2 text-sm text-ink-muted">
        {icon}
        {label}
      </span>
      <span className="text-sm text-ink-primary font-medium text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

function Tip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-base-border bg-base-950 px-3 py-2 text-xs shadow-glow">
      <p className="text-ink-muted font-mono mb-1">{label}</p>
      {payload
        .filter((p) => p.dataKey !== "band")
        .map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.dataKey === "actualKwh" ? "Actual" : "Predicted"}: {p.value} kWh
          </p>
        ))}
    </div>
  );
}
