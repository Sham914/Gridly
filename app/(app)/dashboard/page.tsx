"use client";

import { Fragment } from "react";
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Cell,
} from "recharts";
import {
  Zap,
  IndianRupee,
  TrendingUp,
  Clock,
  Leaf,
  PiggyBank,
} from "lucide-react";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { ChartCard } from "@/components/ChartCard";
import { InsightCard } from "@/components/InsightCard";
import { SeverityBadge } from "@/components/AnomalyBadge";
import { SectionHeader } from "@/components/SectionHeader";
import Link from "next/link";
import {
  kpis,
  getForecast,
  getWeeklyCostBreakdown,
  getUsageByTimeOfDay,
  getWeeklyHeatmap,
  insights,
  anomalies,
  recommendations,
} from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";

const chartAxisStyle = { fontSize: 11, fill: "#7C8A78" };

export default function DashboardPage() {
  const forecast = getForecast("7d").map((d) => ({
    ...d,
    band: [d.lowerBoundKwh, d.upperBoundKwh] as [number, number],
  }));
  const costBreakdown = getWeeklyCostBreakdown();
  const timeOfDay = getUsageByTimeOfDay();
  const heatmap = getWeeklyHeatmap();

  return (
    <div>
      <Header title="Energy Overview" subtitle="Main Campus Building · Last 30 days" />

      <div className="p-4 sm:p-6 space-y-6">
        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard
            label="Total Consumption"
            value={`${kpis.totalConsumptionKwh.toLocaleString("en-IN")} kWh`}
            icon={<Zap className="h-4 w-4" />}
          />
          <MetricCard
            label="Estimated Cost"
            value={formatINR(kpis.estimatedCostInr)}
            icon={<IndianRupee className="h-4 w-4" />}
          />
          <MetricCard
            label="Monthly Change"
            value={`+${kpis.monthlyChangePct}%`}
            trend={{ value: "vs last month", positive: false }}
            icon={<TrendingUp className="h-4 w-4" />}
            accent="warning"
          />
          <MetricCard
            label="Peak Demand"
            value={kpis.peakDemandTime}
            hint="The hour of day when this building's load is consistently highest."
            icon={<Clock className="h-4 w-4" />}
            accent="indigo"
          />
          <MetricCard
            label="Avoidable Usage"
            value={`${kpis.potentialAvoidableKwh} kWh`}
            hint="Energy consumption that analysis suggests could be eliminated without affecting operations."
            icon={<Leaf className="h-4 w-4" />}
            accent="savings"
          />
          <MetricCard
            label="Potential Savings"
            value={formatINR(kpis.potentialMonthlySavingsInr)}
            icon={<PiggyBank className="h-4 w-4" />}
            accent="savings"
          />
        </div>

        {/* Trend + forecast */}
        <ChartCard
          title="Energy Consumption Trend"
          description="Actual usage with a 7-day forecast and confidence range"
        >
          <div className="h-80 min-w-[560px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast} margin={{ left: -10, right: 10 }}>
                <defs>
                  <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8B87F6" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="#8B87F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(232,240,226,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  dataKey="band"
                  stroke="none"
                  fill="url(#bandFill)"
                  isAnimationActive={false}
                />
                <Line
                  dataKey="actualKwh"
                  stroke="#FBBF24"
                  strokeWidth={2.25}
                  dot={false}
                  connectNulls
                />
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
          <Legend
            items={[
              { color: "#FBBF24", label: "Actual usage" },
              { color: "#8B87F6", label: "Forecast", dashed: true },
              { color: "rgba(139,135,246,0.35)", label: "Confidence range" },
            ]}
          />
        </ChartCard>

        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Cost Breakdown" description="Estimated electricity cost by week">
            <div className="h-64 min-w-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={costBreakdown} margin={{ left: -10 }}>
                  <CartesianGrid stroke="rgba(232,240,226,0.06)" vertical={false} />
                  <XAxis dataKey="week" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} width={40} />
                  <Tooltip content={<ChartTooltip prefix="₹" />} />
                  <Bar dataKey="cost" radius={[4, 4, 0, 0]} fill="#FBBF24" maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Usage by Time of Day" description="Where consumption concentrates across a day">
            <div className="h-64 min-w-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDay} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="rgba(232,240,226,0.06)" horizontal={false} />
                  <XAxis type="number" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ ...chartAxisStyle, fontSize: 10.5 }}
                    tickLine={false}
                    axisLine={false}
                    width={110}
                  />
                  <Tooltip content={<ChartTooltip suffix=" kWh" />} />
                  <Bar dataKey="kwh" radius={[0, 4, 4, 0]} fill="#8B87F6" maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard
          title="Weekly Energy Pattern"
          description="Hourly load across the last 7 days — darker cells mean higher draw"
        >
          <HeatmapGrid cells={heatmap} />
        </ChartCard>

        <div className="grid lg:grid-cols-3 gap-6">
          <ChartCard title="Top Energy Insights" className="lg:col-span-1">
            <div className="space-y-2.5">
              {insights.map((i) => (
                <InsightCard key={i.id} insight={i} />
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Active Anomalies"
            actions={
              <Link href="/anomalies" className="text-xs text-accent-gold hover:underline">
                View all
              </Link>
            }
          >
            <div className="space-y-2.5">
              {anomalies.map((a) => (
                <div
                  key={a.id}
                  className="rounded border border-base-border bg-white/[0.02] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-ink-primary font-medium">{a.type}</p>
                    <SeverityBadge severity={a.severity} />
                  </div>
                  <p className="text-xs text-ink-muted mt-1.5">
                    {a.actualKwh} kWh actual vs {a.expectedKwh} kWh expected ·{" "}
                    {formatINR(a.costImpactInr)} impact
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>

          <ChartCard
            title="Top Recommendations"
            actions={
              <Link href="/recommendations" className="text-xs text-accent-gold hover:underline">
                View all
              </Link>
            }
          >
            <div className="space-y-2.5">
              {recommendations.slice(0, 3).map((r) => (
                <div key={r.id} className="rounded border border-base-border bg-white/[0.02] p-3">
                  <p className="text-sm text-ink-primary font-medium">{r.title}</p>
                  <p className="text-xs text-ink-muted mt-1.5">
                    Save {r.savingsKwhRange[0]}–{r.savingsKwhRange[1]} kWh/wk ·{" "}
                    {formatINR(r.savingsInrRange[0])}–{formatINR(r.savingsInrRange[1])}/mo
                  </p>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function Legend({
  items,
}: {
  items: { color: string; label: string; dashed?: boolean }[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-base-border">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5 text-xs text-ink-muted">
          <span
            className="h-0.5 w-4 inline-block"
            style={{
              backgroundColor: it.dashed ? "transparent" : it.color,
              borderTop: it.dashed ? `2px dashed ${it.color}` : undefined,
              borderRadius: it.dashed ? 0 : 4,
              height: it.dashed ? 0 : 3,
            }}
          />
          {it.label}
        </div>
      ))}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  prefix,
  suffix,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  prefix?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-base-border bg-base-950 px-3 py-2 text-xs shadow-glow">
      <p className="text-ink-muted font-mono mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name ?? p.dataKey}: {prefix}
          {p.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}

function HeatmapGrid({ cells }: { cells: { day: string; hour: number; value: number }[] }) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...cells.map((c) => c.value), 1);

  return (
    <div className="min-w-[640px]">
      <div className="grid grid-cols-[48px_repeat(24,minmax(0,1fr))] gap-1">
        <div />
        {Array.from({ length: 24 }).map((_, h) => (
          <div key={h} className="text-[9px] font-mono text-ink-muted text-center">
            {h % 3 === 0 ? h : ""}
          </div>
        ))}
        {days.map((day) => (
          <Fragment key={day}>
            <div className="text-xs font-mono text-ink-muted flex items-center">
              {day}
            </div>
            {Array.from({ length: 24 }).map((_, hour) => {
              const cell = cells.find((c) => c.day === day && c.hour === hour);
              const intensity = cell ? cell.value / max : 0;
              return (
                <div
                  key={`${day}-${hour}`}
                  title={`${day} ${hour}:00 — ${cell?.value ?? 0} kWh`}
                  className="aspect-square rounded-[3px]"
                  style={{
                    backgroundColor: `rgba(251,191,36,${0.06 + intensity * 0.85})`,
                  }}
                />
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
