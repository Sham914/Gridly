import type {
  EnergyReading,
  ForecastPoint,
  EnergyAnomaly,
  Recommendation,
  Insight,
  HeatmapCell,
} from "./types";

// ---------- Deterministic PRNG (mulberry32) so SSR and client render match ----------
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260101);

// Fixed anchor so generated data never shifts between builds/renders.
const END_DATE = new Date("2026-09-16T23:00:00");
const RATE_PER_KWH = 8.8; // INR per kWh, blended tariff

// Fraction of a weekday's total energy consumed in each hour (0-23).
const HOURLY_SHAPE = [
  0.014, 0.012, 0.011, 0.011, 0.012, 0.016, 0.025, 0.036, 0.05, 0.061, 0.066,
  0.069, 0.063, 0.067, 0.071, 0.076, 0.069, 0.058, 0.05, 0.045, 0.039, 0.031,
  0.021, 0.017,
];
const WEEKDAY_DAILY_KWH = 47.5;
const WEEKEND_FACTOR = 0.56;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function buildReadings(days: number): EnergyReading[] {
  const readings: EnergyReading[] = [];
  const totalHours = days * 24;

  for (let i = totalHours - 1; i >= 0; i--) {
    const ts = new Date(END_DATE.getTime() - i * 60 * 60 * 1000);
    const hour = ts.getHours();
    const weekday = ts.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const dailyTotal = WEEKDAY_DAILY_KWH * (isWeekend ? WEEKEND_FACTOR : 1);
    const noise = 0.88 + rand() * 0.24; // +/-12% natural variation
    let usage = dailyTotal * HOURLY_SHAPE[hour] * noise;

    readings.push({
      timestamp: ts.toISOString(),
      hour,
      weekday,
      usageKwh: Math.round(usage * 100) / 100,
      costInr: Math.round(usage * RATE_PER_KWH * 100) / 100,
      isWeekend,
    });
  }

  // ---- Inject the three intentional anomalies from the brief ----
  // 1. High night-time base load, 8 days ago at 02:00
  injectAnomaly(readings, 8, 2, 17.2);
  // 2. Unexpected afternoon spike, 4 days ago at 14:00
  injectAnomaly(readings, 4, 14, 24.5);
  // 3. Weekend energy anomaly is a full-day effect, applied in getAnomalies() cost math;
  //    here we bump the Saturday 13:00 slot as the visible spike on the trend chart.
  injectAnomaly(readings, 2, 13, 12.4);

  return readings;
}

function injectAnomaly(
  readings: EnergyReading[],
  daysAgo: number,
  hour: number,
  targetKwh: number,
) {
  const targetTime =
    END_DATE.getTime() - daysAgo * 24 * 60 * 60 * 1000;
  const idx = readings.findIndex((r) => {
    const t = new Date(r.timestamp).getTime();
    return Math.abs(t - targetTime) < 30 * 60 * 1000 && r.hour === hour;
  });
  if (idx >= 0) {
    readings[idx].usageKwh = targetKwh;
    readings[idx].costInr = Math.round(targetKwh * RATE_PER_KWH * 100) / 100;
  }
}

export const energyReadings: EnergyReading[] = buildReadings(30);

export function getLast30Days(): EnergyReading[] {
  return energyReadings;
}

export function getReadingsForRange(days: number): EnergyReading[] {
  return energyReadings.slice(-days * 24);
}

// ---------- Aggregations ----------
export function getDailyTotals(days = 30) {
  const readings = getReadingsForRange(days);
  const byDay = new Map<string, { date: string; kwh: number; cost: number }>();
  for (const r of readings) {
    const day = r.timestamp.slice(0, 10);
    const existing = byDay.get(day) ?? { date: day, kwh: 0, cost: 0 };
    existing.kwh += r.usageKwh;
    existing.cost += r.costInr;
    byDay.set(day, existing);
  }
  return Array.from(byDay.values()).map((d) => ({
    ...d,
    kwh: Math.round(d.kwh * 10) / 10,
    cost: Math.round(d.cost),
  }));
}

export function getWeeklyCostBreakdown() {
  const daily = getDailyTotals(28);
  const weeks: { week: string; cost: number; kwh: number }[] = [];
  for (let w = 0; w < 4; w++) {
    const slice = daily.slice(w * 7, w * 7 + 7);
    const cost = slice.reduce((s, d) => s + d.cost, 0);
    const kwh = slice.reduce((s, d) => s + d.kwh, 0);
    weeks.push({
      week: `Week ${w + 1}`,
      cost: Math.round(cost),
      kwh: Math.round(kwh * 10) / 10,
    });
  }
  return weeks;
}

export function getUsageByTimeOfDay() {
  const buckets = [
    { label: "Night (12–6 AM)", start: 0, end: 6 },
    { label: "Morning (6–12 PM)", start: 6, end: 12 },
    { label: "Afternoon (12–6 PM)", start: 12, end: 18 },
    { label: "Evening (6–12 AM)", start: 18, end: 24 },
  ];
  const readings = getReadingsForRange(30);
  return buckets.map((b) => {
    const total = readings
      .filter((r) => r.hour >= b.start && r.hour < b.end)
      .reduce((s, r) => s + r.usageKwh, 0);
    return { label: b.label, kwh: Math.round(total * 10) / 10 };
  });
}

export function getWeeklyHeatmap(): HeatmapCell[] {
  const readings = getReadingsForRange(7);
  const cells: HeatmapCell[] = [];
  const grouped = new Map<string, number[]>();
  for (const r of readings) {
    const key = DAY_LABELS[new Date(r.timestamp).getDay()];
    const arr = grouped.get(key) ?? new Array(24).fill(0);
    arr[r.hour] += r.usageKwh;
    grouped.set(key, arr);
  }
  for (const [day, hours] of grouped.entries()) {
    hours.forEach((value, hour) => {
      cells.push({ day, hour, value: Math.round(value * 10) / 10 });
    });
  }
  return cells;
}

export function getWeekdayVsWeekend() {
  const readings = getReadingsForRange(30);
  const weekdayHours = new Array(24).fill(0);
  const weekendHours = new Array(24).fill(0);
  let weekdayDays = 0;
  let weekendDays = 0;
  const seenDays = new Set<string>();
  for (const r of readings) {
    const day = r.timestamp.slice(0, 10);
    if (!seenDays.has(day)) {
      seenDays.add(day);
      if (r.isWeekend) weekendDays++;
      else weekdayDays++;
    }
    if (r.isWeekend) weekendHours[r.hour] += r.usageKwh;
    else weekdayHours[r.hour] += r.usageKwh;
  }
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    label: `${hour.toString().padStart(2, "0")}:00`,
    weekday: Math.round((weekdayHours[hour] / Math.max(weekdayDays, 1)) * 100) / 100,
    weekend: Math.round((weekendHours[hour] / Math.max(weekendDays, 1)) * 100) / 100,
  }));
}

export function getBaseLoad() {
  // Base load = average usage during the quietest hours (1–4 AM)
  const readings = getReadingsForRange(30);
  const quiet = readings.filter((r) => r.hour >= 1 && r.hour <= 4);
  const avg = quiet.reduce((s, r) => s + r.usageKwh, 0) / quiet.length;
  return Math.round(avg * 100) / 100;
}

export function getTariffPeriodUsage() {
  const periods = [
    { label: "Off-peak (10 PM–6 AM)", start: 22, end: 6, rate: 6.2 },
    { label: "Normal (6 AM–2 PM)", start: 6, end: 14, rate: 8.5 },
    { label: "Peak (2 PM–10 PM)", start: 14, end: 22, rate: 11.4 },
  ];
  const readings = getReadingsForRange(30);
  return periods.map((p) => {
    const inPeriod = readings.filter((r) =>
      p.start > p.end
        ? r.hour >= p.start || r.hour < p.end
        : r.hour >= p.start && r.hour < p.end,
    );
    const kwh = inPeriod.reduce((s, r) => s + r.usageKwh, 0);
    return {
      label: p.label,
      kwh: Math.round(kwh * 10) / 10,
      cost: Math.round(kwh * p.rate),
      rate: p.rate,
    };
  });
}

// ---------- Forecast ----------
export function getForecast(horizon: "24h" | "7d" | "30d"): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  const historyHours = horizon === "24h" ? 24 : horizon === "7d" ? 24 * 3 : 24 * 7;
  const futureUnits = horizon === "24h" ? 24 : horizon === "7d" ? 7 : 30;
  const stepHours = horizon === "24h" ? 1 : 24;

  const history = getReadingsForRange(30).slice(-historyHours);
  history.forEach((r) => {
    const date = new Date(r.timestamp);
    points.push({
      timestamp: r.timestamp,
      label:
        horizon === "24h"
          ? date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      actualKwh: r.usageKwh,
      predictedKwh: r.usageKwh,
      lowerBoundKwh: r.usageKwh,
      upperBoundKwh: r.usageKwh,
    });
  });

  const lastTs = new Date(history[history.length - 1].timestamp).getTime();
  for (let i = 1; i <= futureUnits; i++) {
    const ts = new Date(lastTs + i * stepHours * 60 * 60 * 1000);
    const hour = ts.getHours();
    const weekday = ts.getDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const dailyTotal = WEEKDAY_DAILY_KWH * (isWeekend ? WEEKEND_FACTOR : 1);
    const base =
      stepHours === 1
        ? dailyTotal * HOURLY_SHAPE[hour]
        : dailyTotal * (0.98 + rand() * 0.04);
    const drift = 1 + i * 0.002; // slight upward drift, matches +13.4% MoM trend
    const predicted = base * drift;
    const band = predicted * 0.14;
    points.push({
      timestamp: ts.toISOString(),
      label:
        stepHours === 1
          ? ts.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          : ts.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      predictedKwh: Math.round(predicted * 100) / 100,
      lowerBoundKwh: Math.round((predicted - band) * 100) / 100,
      upperBoundKwh: Math.round((predicted + band) * 100) / 100,
    });
  }
  return points;
}

// ---------- Anomalies (exact figures from the brief) ----------
export const anomalies: EnergyAnomaly[] = [
  {
    id: "an-1",
    timestamp: new Date(END_DATE.getTime() - 8 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    type: "High night-time base load",
    severity: "High",
    actualKwh: 17.2,
    expectedKwh: 4.1,
    excessKwh: 13.1,
    costImpactInr: 105,
    status: "Open",
    whatHappened:
      "Consumption between 1 AM and 3 AM stayed near daytime levels instead of dropping to the usual overnight base load.",
    whyUnusual:
      "Night-time draw is normally the building's quietest period. This reading is over four times the typical base load for that hour.",
    likelyCauses: [
      "HVAC left running instead of shutting down after hours",
      "Equipment or server room left powered on unnecessarily",
      "Lighting circuit not switching off on schedule",
    ],
    recommendedAction:
      "Check the after-hours HVAC and lighting shutdown schedule for this zone, and confirm no equipment was left on by mistake.",
  },
  {
    id: "an-2",
    timestamp: new Date(END_DATE.getTime() - 4 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(),
    type: "Unexpected afternoon spike",
    severity: "Medium",
    actualKwh: 24.5,
    expectedKwh: 13.8,
    excessKwh: 10.7,
    costImpactInr: 88,
    status: "Investigating",
    whatHappened:
      "Usage jumped sharply at 2 PM, well above the typical early-afternoon load for a weekday.",
    whyUnusual:
      "This time slot usually sits close to the daily average; the spike is nearly double the expected draw.",
    likelyCauses: [
      "Multiple high-power appliances started at the same time",
      "Cooling system compensating for an open door or window",
      "A one-off event or equipment test running in the building",
    ],
    recommendedAction:
      "Review equipment logs for that hour and stagger high-power startups going forward.",
  },
  {
    id: "an-3",
    timestamp: new Date(END_DATE.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    type: "Weekend energy anomaly",
    severity: "Critical",
    actualKwh: 95,
    expectedKwh: 54,
    excessKwh: 41,
    costImpactInr: 328,
    status: "Open",
    whatHappened:
      "Total weekend-day consumption came in far above the usual weekend pattern, closer to a weekday load.",
    whyUnusual:
      "Weekend usage is expected to drop well below weekday levels since occupancy is low. This day showed almost no reduction at all.",
    likelyCauses: [
      "Building systems not switched to weekend/unoccupied mode",
      "Unplanned weekend occupancy or an event on site",
      "A scheduling fault in the building management system",
    ],
    recommendedAction:
      "Confirm the weekend operating schedule is active and investigate why occupancy-linked systems stayed at weekday levels.",
  },
];

// ---------- Recommendations (exact figures from the brief) ----------
export const recommendations: Recommendation[] = [
  {
    id: "rec-1",
    priority: 1,
    title: "Review HVAC shutdown schedule after 6 PM",
    reason:
      "Cooling load is still running well into the evening on multiple floors, past the hours when occupancy drops off.",
    savingsKwhRange: [18, 25],
    savingsInrRange: [700, 1000],
    effort: "Low",
    confidence: "High",
    status: "Pending",
  },
  {
    id: "rec-2",
    priority: 2,
    title: "Reduce overnight lighting and plug loads",
    reason:
      "Night-time readings show lighting and idle equipment drawing power well past closing time.",
    savingsKwhRange: [12, 18],
    savingsInrRange: [400, 600],
    effort: "Low",
    confidence: "High",
    status: "Pending",
  },
  {
    id: "rec-3",
    priority: 3,
    title: "Stagger high-power equipment startup times",
    reason:
      "Simultaneous equipment startup is creating sharp demand peaks that raise both risk and cost.",
    savingsKwhRange: [8, 12],
    savingsInrRange: [250, 400],
    effort: "Medium",
    confidence: "Medium",
    status: "Pending",
  },
  {
    id: "rec-4",
    priority: 4,
    title: "Inspect HVAC filters and cooling efficiency",
    reason:
      "Gradual load increase during peak afternoon hours is consistent with reduced cooling efficiency.",
    savingsKwhRange: [15, 22],
    savingsInrRange: [500, 750],
    effort: "Medium",
    confidence: "Medium",
    status: "Pending",
  },
];

// ---------- Insights ----------
export const insights: Insight[] = [
  {
    id: "ins-1",
    title: "Afternoon peak is your single largest cost driver",
    explanation:
      "The 2–5 PM window falls inside the peak tariff period and consistently carries the heaviest load of the day.",
    kind: "warning",
  },
  {
    id: "ins-2",
    title: "Weekend usage is running higher than it should",
    explanation:
      "Weekend consumption is only about 44% lower than weekdays, when a well-managed building typically sees a much sharper drop.",
    kind: "warning",
  },
  {
    id: "ins-3",
    title: "Base load has room to shrink",
    explanation:
      "Overnight consumption sits above what an empty building should draw, pointing to equipment or lighting left running unnecessarily.",
    kind: "neutral",
  },
  {
    id: "ins-4",
    title: "Morning ramp-up is efficient",
    explanation:
      "The 6–9 AM startup period shows a smooth, predictable rise with no signs of wasteful spikes.",
    kind: "positive",
  },
];

// ---------- Static KPI + summary figures (as specified) ----------
export const kpis = {
  totalConsumptionKwh: 1248,
  estimatedCostInr: 10984,
  monthlyChangePct: 13.4,
  peakDemandTime: "3:00 PM",
  potentialAvoidableKwh: 74,
  potentialMonthlySavingsInr: 4320,
  potentialReductionPct: 12.4,
};

export const forecastSummary = {
  predictedWeeklyKwh: 286,
  predictedWeeklyCostInr: 2376,
  expectedPeak: "Friday, 2 PM–4 PM",
  budgetOverrunRisk: "Medium" as const,
  model: "XGBoost Time Series Forecaster",
  inputs: ["historical usage", "hour", "weekday", "weather", "occupancy"],
  maeKwhPerHour: 1.9,
  confidencePct: 89,
};

export const savingsTracker = [
  { month: "Apr", before: 1180, after: 1180 },
  { month: "May", before: 1205, after: 1160 },
  { month: "Jun", before: 1230, after: 1120 },
  { month: "Jul", before: 1260, after: 1098 },
  { month: "Aug", before: 1248, after: 1085 },
  { month: "Sep", before: 1248, after: 1093 },
];
