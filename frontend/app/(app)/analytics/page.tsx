"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend as RLegend,
} from "recharts";
import { Users, Ruler } from "lucide-react";
import { Header } from "@/components/Header";
import { ChartCard } from "@/components/ChartCard";
import { MetricCard } from "@/components/MetricCard";
import {
  getDailyTotals,
  getReadingsForRange,
  getWeekdayVsWeekend,
  getBaseLoad,
  getTariffPeriodUsage,
  kpis,
} from "@/lib/mock-data";
import { cn } from "@/lib/utils";

const chartAxisStyle = { fontSize: 11, fill: "#7C8A78" };
const TABS = ["Day", "Week", "Month"] as const;
type Tab = (typeof TABS)[number];

const OCCUPANTS = 120;
const AREA_SQM = 2400;

export default function AnalyticsPage() {
  const [tab, setTab] = useState<Tab>("Week");

  const comparisonData =
    tab === "Day"
      ? getReadingsForRange(1).map((r) => ({
          label: `${r.hour.toString().padStart(2, "0")}:00`,
          kwh: r.usageKwh,
        }))
      : tab === "Week"
      ? getDailyTotals(7).map((d) => ({ label: d.date.slice(5), kwh: d.kwh }))
      : getDailyTotals(30).map((d) => ({ label: d.date.slice(5), kwh: d.kwh }));

  const weekdayWeekend = getWeekdayVsWeekend();
  const baseLoad = getBaseLoad();
  const tariff = getTariffPeriodUsage();

  const peakHours = [...weekdayWeekend]
    .sort((a, b) => b.weekday - a.weekday)
    .slice(0, 6)
    .sort((a, b) => a.hour - b.hour);

  return (
    <div>
      <Header title="Usage Analytics" subtitle="Detailed consumption breakdowns" />

      <div className="p-4 sm:p-6 space-y-6">
        <div className="inline-flex rounded border border-base-border bg-white/[0.03] p-1">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "focus-ring rounded px-4 py-1.5 text-sm transition-colors",
                tab === t
                  ? "bg-accent-gold text-base-950 font-medium"
                  : "text-ink-secondary hover:text-ink-primary",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        <ChartCard
          title="Consumption Comparison"
          description={`Usage across the selected ${tab.toLowerCase()} view`}
        >
          <div className="h-72 min-w-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ left: -10 }}>
                <CartesianGrid stroke="rgba(232,240,226,0.06)" vertical={false} />
                <XAxis dataKey="label" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<Tip suffix=" kWh" />} />
                <Bar dataKey="kwh" radius={[4, 4, 0, 0]} fill="#FBBF24" maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard
            title="Weekday vs Weekend"
            description="Average hourly load, weekday against weekend"
          >
            <div className="h-64 min-w-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weekdayWeekend} margin={{ left: -10 }}>
                  <CartesianGrid stroke="rgba(232,240,226,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={chartAxisStyle} tickLine={false} axisLine={false} interval={2} />
                  <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} width={36} />
                  <Tooltip content={<Tip suffix=" kWh" />} />
                  <RLegend wrapperStyle={{ fontSize: 11, color: "#B9C4B0" }} />
                  <Line dataKey="weekday" name="Weekday" stroke="#FBBF24" strokeWidth={2} dot={false} />
                  <Line dataKey="weekend" name="Weekend" stroke="#8B87F6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard
            title="Peak Usage Hours"
            description="The six busiest hours on a typical weekday"
          >
            <div className="h-64 min-w-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={peakHours} margin={{ left: -10 }}>
                  <CartesianGrid stroke="rgba(232,240,226,0.06)" vertical={false} />
                  <XAxis dataKey="label" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                  <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} width={36} />
                  <Tooltip content={<Tip suffix=" kWh" />} />
                  <Bar dataKey="weekday" radius={[4, 4, 0, 0]} fill="#F0625B" maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <ChartCard
            title="Base-Load Analysis"
            description="Overnight (1–4 AM) consumption — the floor your building never drops below"
          >
            <div className="flex items-center gap-6 py-4">
              <div>
                <p className="text-3xl font-semibold text-accent-gold">{baseLoad} kWh</p>
                <p className="text-xs text-ink-muted mt-1">average hourly base load</p>
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed max-w-xs">
                A well-managed building of this size typically holds base load
                near 2.5–3 kWh. The gap above that points to equipment or
                lighting left running overnight.
              </p>
            </div>
          </ChartCard>

          <ChartCard
            title="Tariff-Period Usage"
            description="Consumption and cost split across off-peak, normal and peak rate windows"
          >
            <div className="h-56 min-w-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tariff} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid stroke="rgba(232,240,226,0.06)" horizontal={false} />
                  <XAxis type="number" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ ...chartAxisStyle, fontSize: 10.5 }}
                    tickLine={false}
                    axisLine={false}
                    width={130}
                  />
                  <Tooltip content={<Tip suffix=" kWh" />} />
                  <Bar dataKey="kwh" radius={[0, 4, 4, 0]} fill="#34D399" maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <MetricCard
            label="Energy Intensity / Occupant"
            value={`${(kpis.totalConsumptionKwh / OCCUPANTS).toFixed(1)} kWh`}
            hint={`Based on an estimated ${OCCUPANTS} regular occupants over the last 30 days.`}
            icon={<Users className="h-4 w-4" />}
            accent="indigo"
          />
          <MetricCard
            label="Energy Intensity / m²"
            value={`${(kpis.totalConsumptionKwh / AREA_SQM).toFixed(2)} kWh`}
            hint={`Based on an estimated ${AREA_SQM.toLocaleString("en-IN")} m² of floor area.`}
            icon={<Ruler className="h-4 w-4" />}
            accent="indigo"
          />
        </div>

        <ChartCard title="What's driving high usage">
          <p className="text-sm text-ink-secondary leading-relaxed">
            The afternoon window between 2 PM and 5 PM lines up with both the
            building's peak tariff period and its highest cooling demand,
            which is why it dominates the monthly bill. Weekend usage sits
            closer to weekday levels than expected, suggesting HVAC or
            lighting schedules aren't switching into an unoccupied mode.
            Overnight base load is the smallest slice of total energy, but
            it's the easiest to bring down since almost none of it should be
            necessary when the building is empty.
          </p>
        </ChartCard>
      </div>
    </div>
  );
}

function Tip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-base-border bg-base-950 px-3 py-2 text-xs shadow-glow">
      <p className="text-ink-muted font-mono mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name ?? p.dataKey}: {p.value}
          {suffix}
        </p>
      ))}
    </div>
  );
}
