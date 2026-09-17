"use client";

import { useMemo, useState } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ZAxis,
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import { X, Eye } from "lucide-react";
import { Header } from "@/components/Header";
import { ChartCard } from "@/components/ChartCard";
import { SeverityBadge, StatusBadge } from "@/components/AnomalyBadge";
import { anomalies as allAnomalies } from "@/lib/mock-data";
import type { AnomalySeverity, EnergyAnomaly } from "@/lib/types";
import { formatINR, cn } from "@/lib/utils";

const FILTERS: ("All" | AnomalySeverity)[] = ["All", "Critical", "High", "Medium", "Low"];

export default function AnomaliesPage() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [selected, setSelected] = useState<EnergyAnomaly | null>(null);

  const filtered = useMemo(
    () => (filter === "All" ? allAnomalies : allAnomalies.filter((a) => a.severity === filter)),
    [filter],
  );

  const timelineData = allAnomalies.map((a) => ({
    x: new Date(a.timestamp).getTime(),
    y: a.excessKwh,
    z: a.costImpactInr,
    severity: a.severity,
    label: new Date(a.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
  }));

  return (
    <div>
      <Header title="Abnormal Energy Usage Detection" subtitle="Readings that break from expected patterns" />

      <div className="p-4 sm:p-6 space-y-6">
        <ChartCard title="Anomaly Timeline" description="Excess energy above expectation, sized by cost impact">
          <div className="h-56 min-w-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ left: -10, right: 10, top: 10 }}>
                <CartesianGrid stroke="rgba(232,240,226,0.06)" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={["dataMin", "dataMax"]}
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                  }
                  tick={{ fontSize: 11, fill: "#7C8A78" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  dataKey="y"
                  tick={{ fontSize: 11, fill: "#7C8A78" }}
                  tickLine={false}
                  axisLine={false}
                  width={36}
                  label={{ value: "Excess kWh", angle: -90, position: "insideLeft", fill: "#7C8A78", fontSize: 11 }}
                />
                <ZAxis dataKey="z" range={[80, 400]} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload;
                    return (
                      <div className="rounded border border-base-border bg-base-950 px-3 py-2 text-xs shadow-glow">
                        <p className="text-ink-muted font-mono mb-1">{p.label}</p>
                        <p className="text-ink-primary">Excess: {p.y} kWh</p>
                        <p className="text-ink-primary">Cost impact: {formatINR(p.z)}</p>
                      </div>
                    );
                  }}
                />
                <Scatter data={timelineData} fill="#F0625B" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "focus-ring rounded border px-3 py-1.5 text-xs font-mono transition-colors",
                filter === f
                  ? "border-accent-gold/40 bg-accent-gold/10 text-accent-gold"
                  : "border-base-border text-ink-secondary hover:text-ink-primary",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="rounded-card border border-base-border bg-base-surface/70 overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm min-w-[820px]">
            <thead>
              <tr className="border-b border-base-border text-left text-xs font-mono uppercase text-ink-muted">
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Actual</th>
                <th className="px-4 py-3">Expected</th>
                <th className="px-4 py-3">Excess</th>
                <th className="px-4 py-3">Cost Impact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-base-border/60 last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td className="px-4 py-3 text-ink-secondary font-mono text-xs">
                    {new Date(a.timestamp).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3 text-ink-primary">{a.type}</td>
                  <td className="px-4 py-3 text-ink-primary">{a.actualKwh} kWh</td>
                  <td className="px-4 py-3 text-ink-muted">{a.expectedKwh} kWh</td>
                  <td className="px-4 py-3 text-status-warning">+{a.excessKwh} kWh</td>
                  <td className="px-4 py-3 text-ink-primary">{formatINR(a.costImpactInr)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelected(a)}
                      className="focus-ring inline-flex items-center gap-1 text-xs text-accent-gold hover:underline"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View details
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-ink-muted text-sm">
                    No anomalies at this severity level.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70"
              onClick={() => setSelected(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-y-0 right-0 z-50 w-full sm:w-[440px] bg-base-surface border-l border-base-border p-6 overflow-y-auto scrollbar-thin"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <SeverityBadge severity={selected.severity} />
                  <h2 className="text-lg font-semibold text-ink-primary mt-2">
                    {selected.type}
                  </h2>
                </div>
                <button
                  aria-label="Close"
                  onClick={() => setSelected(null)}
                  className="focus-ring rounded p-1 text-ink-muted hover:text-ink-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 text-sm">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <DetailStat label="Actual" value={`${selected.actualKwh} kWh`} />
                  <DetailStat label="Expected" value={`${selected.expectedKwh} kWh`} />
                  <DetailStat label="Cost Impact" value={formatINR(selected.costImpactInr)} />
                </div>

                <DetailBlock title="What happened" text={selected.whatHappened} />
                <DetailBlock title="Why it is unusual" text={selected.whyUnusual} />
                <div>
                  <h3 className="text-xs font-mono uppercase text-ink-muted mb-1.5">
                    Likely causes
                  </h3>
                  <ul className="space-y-1.5">
                    {selected.likelyCauses.map((c) => (
                      <li key={c} className="flex gap-2 text-ink-secondary leading-relaxed">
                        <span className="text-accent-gold mt-1">•</span>
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <DetailBlock title="Recommended action" text={selected.recommendedAction} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-base-border bg-white/[0.02] p-2.5">
      <p className="text-[10px] font-mono uppercase text-ink-muted">{label}</p>
      <p className="text-sm text-ink-primary font-medium mt-0.5">{value}</p>
    </div>
  );
}

function DetailBlock({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h3 className="text-xs font-mono uppercase text-ink-muted mb-1.5">{title}</h3>
      <p className="text-ink-secondary leading-relaxed">{text}</p>
    </div>
  );
}
