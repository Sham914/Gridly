"use client";

import { motion } from "framer-motion";
import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";
import { Zap, TrendingUp } from "lucide-react";
import { getDailyTotals, kpis } from "@/lib/mock-data";
import { formatINR } from "@/lib/utils";

export function LandingChartPreview() {
  const data = getDailyTotals(14);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-card border border-base-border bg-base-surface/80 p-5 shadow-glow"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-mono text-ink-muted uppercase">Live preview</p>
          <p className="text-sm font-semibold text-ink-primary mt-0.5">
            Main Campus Building
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded bg-status-savings/10 text-status-savings text-xs font-mono px-2 py-1 border border-status-savings/25">
          <TrendingUp className="h-3 w-3" />
          -{kpis.potentialReductionPct}% potential
        </span>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="heroFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#FBBF24" stopOpacity={0} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
            <Area
              type="monotone"
              dataKey="kwh"
              stroke="#FBBF24"
              strokeWidth={2}
              fill="url(#heroFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <MiniStat icon={<Zap className="h-3.5 w-3.5" />} label="Total" value={`${kpis.totalConsumptionKwh} kWh`} />
        <MiniStat label="Cost" value={formatINR(kpis.estimatedCostInr)} />
        <MiniStat label="Peak" value={kpis.peakDemandTime} />
      </div>
    </motion.div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded border border-base-border bg-white/[0.02] px-2.5 py-2">
      <div className="flex items-center gap-1 text-[10px] font-mono uppercase text-ink-muted">
        {icon}
        {label}
      </div>
      <p className="text-sm text-ink-primary font-medium mt-0.5">{value}</p>
    </div>
  );
}
