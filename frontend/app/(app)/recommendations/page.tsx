"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend as RLegend } from "recharts";
import { PiggyBank, Leaf, Percent } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { ChartCard } from "@/components/ChartCard";
import { MetricCard } from "@/components/MetricCard";
import { RecommendationCard } from "@/components/RecommendationCard";
import {
  recommendations as initialRecs,
  kpis,
  savingsTracker,
} from "@/lib/mock-data";
import type { Recommendation } from "@/lib/types";
import { formatINR } from "@/lib/utils";

const chartAxisStyle = { fontSize: 11, fill: "#7C8A78" };

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>(initialRecs);

  const updateStatus = (id: string, status: Recommendation["status"]) => {
    setRecs((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    const rec = recs.find((r) => r.id === id);
    if (status === "Completed") {
      toast.success("Recommendation marked as completed.", {
        description: rec?.title,
      });
    } else {
      toast("Recommendation dismissed.", { description: rec?.title });
    }
  };

  return (
    <div>
      <Header title="Energy-Saving Recommendations" subtitle="Ranked actions with estimated impact" />

      <div className="p-4 sm:p-6 space-y-6">
        <ChartCard title="Savings Opportunity">
          <div className="grid sm:grid-cols-3 gap-4">
            <MetricCard
              label="Total Potential Monthly Saving"
              value={formatINR(kpis.potentialMonthlySavingsInr)}
              icon={<PiggyBank className="h-4 w-4" />}
              accent="savings"
            />
            <MetricCard
              label="Potential Reduction"
              value={`${kpis.potentialReductionPct}%`}
              icon={<Percent className="h-4 w-4" />}
              accent="gold"
            />
            <MetricCard
              label="Estimated Avoided Energy"
              value={`${kpis.potentialAvoidableKwh} kWh/month`}
              icon={<Leaf className="h-4 w-4" />}
              accent="savings"
            />
          </div>
        </ChartCard>

        <div className="space-y-3">
          {recs.map((r) => (
            <RecommendationCard
              key={r.id}
              rec={r}
              onComplete={(id) => updateStatus(id, "Completed")}
              onDismiss={(id) => updateStatus(id, "Dismissed")}
            />
          ))}
        </div>

        <ChartCard
          title="Savings Tracker"
          description="Monthly consumption before and after acting on recommendations"
        >
          <div className="h-72 min-w-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={savingsTracker} margin={{ left: -10 }}>
                <CartesianGrid stroke="rgba(232,240,226,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={chartAxisStyle} tickLine={false} axisLine={false} />
                <YAxis tick={chartAxisStyle} tickLine={false} axisLine={false} width={40} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    return (
                      <div className="rounded border border-base-border bg-base-950 px-3 py-2 text-xs shadow-glow">
                        <p className="text-ink-muted font-mono mb-1">{label}</p>
                        {payload.map((p, i) => (
                          <p key={i} style={{ color: p.color }}>
                            {p.name}: {p.value} kWh
                          </p>
                        ))}
                      </div>
                    );
                  }}
                />
                <RLegend wrapperStyle={{ fontSize: 11, color: "#B9C4B0" }} />
                <Bar dataKey="before" name="Before" fill="#7C8A78" radius={[4, 4, 0, 0]} maxBarSize={26} />
                <Bar dataKey="after" name="After" fill="#34D399" radius={[4, 4, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  );
}
