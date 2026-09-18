from __future__ import annotations

import pandas as pd
from prophet import Prophet


def _normalize_household_data(df: pd.DataFrame, meter_id: str) -> pd.DataFrame:
    if df.empty:
        raise ValueError("Forecast dataset is empty.")

    frame = df.copy()
    if "meter" not in frame.columns and "meter_id" in frame.columns:
        frame["meter"] = frame["meter_id"]
    if "meter" not in frame.columns:
        raise ValueError("Forecast dataset must include a 'meter' column.")

    timestamp_col = next((c for c in ["x_Timestamp", "timestamp", "datetime", "date"] if c in frame.columns), None)
    value_col = next((c for c in ["t_kWh", "consumption_kwh", "usage_kwh", "kwh", "value"] if c in frame.columns), None)

    if timestamp_col is None or value_col is None:
        raise ValueError(
            "Unsupported dataset columns. Expected a timestamp and a consumption column like "
            "'x_Timestamp'/'t_kWh' or 'timestamp'/'consumption_kwh'."
        )

    normalized = frame[[timestamp_col, value_col, "meter"]].rename(
        columns={timestamp_col: "ds", value_col: "y", "meter": "meter"}
    )
    normalized["ds"] = pd.to_datetime(normalized["ds"], errors="coerce")
    normalized["y"] = pd.to_numeric(normalized["y"], errors="coerce")
    normalized = normalized.dropna(subset=["ds", "y"]).sort_values("ds")
    normalized = normalized[normalized["meter"].astype(str).str.lower() == str(meter_id).lower()].copy()

    if normalized.empty:
        raise ValueError(f"No rows found for meter '{meter_id}' in the supplied dataset.")

    return normalized


def _infer_prophet_frequency(frame: pd.DataFrame) -> str:
    if frame.shape[0] < 2:
        return "H"

    diffs = frame["ds"].diff().dropna()
    if diffs.empty:
        return "H"

    median_delta = diffs.median()
    if median_delta <= pd.Timedelta(minutes=5):
        return "3min"
    if median_delta <= pd.Timedelta(hours=1):
        return "H"
    if median_delta <= pd.Timedelta(days=1):
        return "D"
    return "D"


def _forecast_periods(forecast_hours: int, frequency: str) -> int:
    if frequency.endswith("min"):
        minutes = pd.to_timedelta(frequency).total_seconds() / 60
        return max(1, int(round(forecast_hours * 60 / minutes)))
    if frequency == "H":
        return max(1, int(forecast_hours))
    if frequency == "D":
        return max(1, int(round(forecast_hours / 24)))
    return max(1, int(forecast_hours))


def forecast_household(meter_id: str, df: pd.DataFrame, forecast_hours: int = 24):
    """
    Runs Prophet forecasting for a single household from processed BR49 data.

    Accepts a realistic dataset with timestamp + consumption columns from the
    processed hourly, daily, or 3-minute files, and normalizes the values before
    fitting the time-series model.
    """
    household = _normalize_household_data(df, meter_id)

    freq = _infer_prophet_frequency(household)
    hourly = (
        household.set_index("ds")["y"]
        .resample(freq)
        .sum()
        .reset_index()
        .rename(columns={"ds": "ds", "y": "y"})
    )

    if hourly.empty:
        raise ValueError(f"No hourly data available for meter '{meter_id}'.")

    model = Prophet(
        daily_seasonality=True,
        weekly_seasonality=True,
        yearly_seasonality=False,
        seasonality_mode="multiplicative",
    )
    model.fit(hourly.rename(columns={"ds": "ds", "y": "y"}))

    periods = _forecast_periods(forecast_hours, freq)
    future = model.make_future_dataframe(periods=periods, freq=freq)
    forecast = model.predict(future)

    forecast["yhat"] = forecast["yhat"].clip(lower=0)
    forecast["yhat_lower"] = forecast["yhat_lower"].clip(lower=0)
    forecast["yhat_upper"] = forecast["yhat_upper"].clip(lower=0)

    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].copy()