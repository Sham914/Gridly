export interface UsagePoint {
  timestamp: string;
  kwh: number;
}

export interface UsageParams {
  meter: string;
  start?: string;
  end?: string;
  limit?: number;
}