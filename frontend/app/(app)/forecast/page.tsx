"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Cpu, Gauge, Target, ShieldAlert, Sparkles } from "lucide-react";
import { Header } from "@/components/Header";
import { ChartCard } from "@/components/ChartCard";
import { MetricCard } from "@/components/MetricCard";
import { fetchForecast } from "@/lib/api";
import { formatINR, cn, formatKWh } from "@/lib/utils";

const chartAxisStyle = { fontSize: 11, fill: "#7C8A78" };
const HORIZONS = [
  { key: "24h", label: "24 Hours" },
  { key: "7d", label: "7 Days" },
  { key: "30d", label: "30 Days" },
] as const;
type HorizonKey = (typeof HORIZONS)[number]["key"];

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<HorizonKey>("7d");
  const [forecast, setForecast] = useState<Array<{ ds: string; yhat: number; yhat_lower: number; yhat_upper: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const horizonMap: Record<HorizonKey, number> = { "24h": 24, "7d": 168, "30d": 720 };
    const run = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await fetchForecast("BR49", horizonMap[horizon]);
        setForecast(response.forecast ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load forecast.");
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [horizon]);

  const data = useMemo(
    () =>
      forecast.map((point) => ({
        label: new Date(point.ds).toLocaleString("en-IN", {
          month: "short",
          day: "numeric",
          hour: horizon === "24h" ? "2-digit" : undefined,
          minute: horizon === "24h" ? "2-digit" : undefined,
        }),
        actualKwh: undefined,
        predictedKwh: Number(point.yhat) || 0,
        lowerBoundKwh: Number(point.yhat_lower) || 0,
        upperBoundKwh: Number(point.yhat_upper) || 0,
        band: [Number(point.yhat_lower) || 0, Number(point.yhat_upper) || 0] as [number, number],
      })),
    [forecast, horizon],
  );

  const summary = useMemo(() => {
    if (!forecast.length) return null;
    const predicted = forecast.map((item) => Number(item.yhat) || 0);
    const avg = predicted.reduce((sum, value) => sum + value, 0) / predicted.length;
    const peak = Math.max(...predicted);
    return {
      predictedWeeklyKwh: formatKWh(avg * 24, 1),
      predictedWeeklyCostInr: `₹${Math.round(avg * 24 * 8.8).toLocaleString("en-IN")}`,
      expectedPeak: `${peak.toFixed(1)} kWh`,
      budgetOverrunRisk: peak > 1.5 * avg ? "Elevated" : "Low",
    };
  }, [forecast]);

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

        {error && (
          <div className="rounded border border-status-warning/40 bg-status-warning/10 px-4 py-3 text-sm text-status-warning">
            {error}. Showing fallback mock estimate if the backend is unavailable.
          </div>
        )}

        <ChartCard
          title="Demand Forecast"
          description="History, prediction and confidence band"
        >
          {isLoading ? (
            <div className="flex h-80 items-center justify-center text-sm text-ink-muted">Loading live forecast…</div>
          ) : (
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
          )}
        </ChartCard>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="Predicted Weekly Usage"
            value={summary ? summary.predictedWeeklyKwh : "—"}
            icon={<Gauge className="h-4 w-4" />}
          />
          <MetricCard
            label="Predicted Weekly Cost"
            value={summary ? summary.predictedWeeklyCostInr : "—"}
            icon={<Target className="h-4 w-4" />}
          />
          <MetricCard
            label="Expected Peak"
            value={summary ? summary.expectedPeak : "—"}
            accent="warning"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <MetricCard
            label="Budget Overrun Risk"
            value={summary ? summary.budgetOverrunRisk : "—"}
            accent="warning"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard title="Model Information">
            <div className="space-y-3">
              <Row icon={<Cpu className="h-4 w-4 text-accent-indigo" />} label="Model" value="Prophet (hourly load model)" />
              <Row label="Inputs" value="timestamp, consumption_kwh, meter" />
              <Row label="Forecast horizon" value={`${horizon}`} />
              <Row label="Confidence" value={forecast.length ? "Live model band" : "Unavailable"} />
            </div>
          </ChartCard>

          <ChartCard title="AI Forecast Explanation">
            <div className="flex items-start gap-3 rounded border border-base-border bg-white/[0.02] p-3.5">
              <Sparkles className="mt-0.5 h-4 w-4 text-accent-gold" />
              <p className="text-sm text-ink-secondary leading-relaxed">
                {forecast.length
                  ? `The live forecasting model is projecting a median load of ${summary ? summary.predictedWeeklyKwh : "near-term usage"} with the strongest demand expected in the upcoming peak window. The prediction band widens over longer horizons, which is expected when forecasting future temperature and occupancy-driven consumption.`
                  : "Live forecast data is not available yet. The backend is expected to return Prophet results for the next forecast window."}
              </p>
            </div>
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
