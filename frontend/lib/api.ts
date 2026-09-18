const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${input}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status})`);
  }

  return (await response.json()) as T;
}

export async function fetchForecast(meterId: string, forecastHours = 24) {
  return fetchJson<{ forecast: Array<{ ds: string; yhat: number; yhat_lower: number; yhat_upper: number }> }>(
    "/predict/forecast",
    {
      method: "POST",
      body: JSON.stringify({
        meter_id: meterId,
        forecast_hours: forecastHours,
        dataset_path: "BR49/br49_hourly.csv",
      }),
    },
  );
}

export async function fetchRecommendationSummary(payload: {
  forecast?: Record<string, unknown> | null;
  anomalies?: Array<Record<string, unknown>>;
  wastage?: Array<Record<string, unknown>>;
}) {
  return fetchJson<{ recommendation: string }>("/recommend", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
