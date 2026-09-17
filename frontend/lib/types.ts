export interface EnergyReading {
  timestamp: string; // ISO string
  hour: number; // 0-23
  weekday: number; // 0-6, 0 = Sunday
  usageKwh: number;
  costInr: number;
  isWeekend: boolean;
}

export interface ForecastPoint {
  timestamp: string;
  label: string;
  actualKwh?: number;
  predictedKwh: number;
  lowerBoundKwh: number;
  upperBoundKwh: number;
}

export type AnomalySeverity = "Critical" | "High" | "Medium" | "Low";
export type AnomalyStatus = "Open" | "Investigating" | "Resolved";

export interface EnergyAnomaly {
  id: string;
  timestamp: string;
  type: string;
  severity: AnomalySeverity;
  actualKwh: number;
  expectedKwh: number;
  excessKwh: number;
  costImpactInr: number;
  status: AnomalyStatus;
  whatHappened: string;
  whyUnusual: string;
  likelyCauses: string[];
  recommendedAction: string;
}

export type RecommendationEffort = "Low" | "Medium" | "High";
export type RecommendationConfidence = "High" | "Medium" | "Low";
export type RecommendationStatus = "Pending" | "Completed" | "Dismissed";

export interface Recommendation {
  id: string;
  priority: number;
  title: string;
  reason: string;
  savingsKwhRange: [number, number];
  savingsInrRange: [number, number];
  effort: RecommendationEffort;
  confidence: RecommendationConfidence;
  status: RecommendationStatus;
}

export interface Insight {
  id: string;
  title: string;
  explanation: string;
  kind: "positive" | "warning" | "neutral";
}

export interface HeatmapCell {
  day: string;
  hour: number;
  value: number;
}

export type LoadSignaturePoint = {
  timestamp: string;
  cluster_label: string;
  consumption_kwh: number;
};

export type PhantomLoadInsight = {
  yearly_night_baseline_kwh: number;
  daily_series: { date: string; night_avg_kwh: number }[];
};
