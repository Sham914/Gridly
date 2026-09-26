"""Anomaly detection utilities for hourly forecasts and live 3-minute readings."""

from __future__ import annotations

import math
import time
from typing import Generator

import pandas as pd

from backend.models.forecasting import forecast_household


def detect_hourly_anomalies(actual_hourly_df: pd.DataFrame, forecast_df: pd.DataFrame) -> pd.DataFrame:
    """Compare actual hourly usage with a forecast and flag out-of-band values.

    Args:
        actual_hourly_df: DataFrame with columns ds and y, representing actual hourly kWh.
        forecast_df: DataFrame returned by forecast_household() with columns ds, yhat,
            yhat_lower, and yhat_upper.

    Returns:
        DataFrame with columns ds, y, yhat, yhat_lower, yhat_upper, is_anomaly,
        and deviation_pct.
    """
    columns = ["ds", "y", "yhat", "yhat_lower", "yhat_upper", "is_anomaly", "deviation_pct"]
    if actual_hourly_df.empty or forecast_df.empty:
        return pd.DataFrame(columns=columns)

    actual = actual_hourly_df.copy()
    forecast = forecast_df.copy()
    actual["ds"] = pd.to_datetime(actual["ds"], errors="coerce")
    forecast["ds"] = pd.to_datetime(forecast["ds"], errors="coerce")
    actual["y"] = pd.to_numeric(actual["y"], errors="coerce")
    forecast = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]

    merged = actual.merge(forecast, on="ds", how="inner").dropna(subset=["ds", "y", "yhat", "yhat_lower", "yhat_upper"])
    if merged.empty:
        return pd.DataFrame(columns=columns)

    merged["is_anomaly"] = (merged["y"] < merged["yhat_lower"]) | (merged["y"] > merged["yhat_upper"])
    merged["deviation_pct"] = merged.apply(
        lambda row: 0.0 if row["yhat"] == 0 else ((row["y"] - row["yhat"]) / row["yhat"]) * 100.0,
        axis=1,
    )
    return merged[columns]


def build_time_of_day_baseline(meter_id: str, df_3min: pd.DataFrame) -> pd.DataFrame:
    """Build a day-of-week and time-of-day baseline for a single household.

    Args:
        meter_id: Household or meter identifier to filter on.
        df_3min: Raw 3-minute DataFrame with timestamp, consumption_kwh, and meter.

    Returns:
        DataFrame with columns day_of_week, time_of_day, baseline_mean, baseline_std.
    """
    columns = ["day_of_week", "time_of_day", "baseline_mean", "baseline_std"]
    if df_3min.empty:
        return pd.DataFrame(columns=columns)

    frame = df_3min.copy()
    frame["timestamp"] = pd.to_datetime(frame.get("timestamp"), errors="coerce")
    frame["consumption_kwh"] = pd.to_numeric(frame.get("consumption_kwh"), errors="coerce")
    frame["meter"] = frame.get("meter").astype(str)
    frame = frame[frame["meter"] == str(meter_id)].dropna(subset=["timestamp", "consumption_kwh"])

    if frame.empty:
        return pd.DataFrame(columns=columns)

    frame["day_of_week"] = frame["timestamp"].dt.dayofweek
    frame["time_of_day"] = frame["timestamp"].dt.floor("3min").dt.strftime("%H:%M")
    baseline = (
        frame.groupby(["day_of_week", "time_of_day"], as_index=False)
        .agg(baseline_mean=("consumption_kwh", "mean"), baseline_std=("consumption_kwh", "std"))
    )
    return baseline[columns]


def detect_live_anomaly(reading: dict, baseline_df: pd.DataFrame, z_threshold: float = 2.5) -> dict:
    """Annotate a live 3-minute reading with a z-score and anomaly flag.

    Args:
        reading: A dict containing at least timestamp, consumption_kwh, and meter.
        baseline_df: Output of build_time_of_day_baseline().
        z_threshold: Absolute z-score threshold above which a reading is anomalous.

    Returns:
        The input reading dict with z_score and is_anomaly keys added.
    """
    result = dict(reading)
    timestamp = pd.to_datetime(result.get("timestamp"), errors="coerce")
    consumption = pd.to_numeric(pd.Series([result.get("consumption_kwh")]), errors="coerce").iloc[0]

    if pd.isna(timestamp) or baseline_df.empty or pd.isna(consumption):
        result["z_score"] = 0.0
        result["is_anomaly"] = False
        return result

    day_of_week = timestamp.dayofweek
    time_of_day = timestamp.floor("3min").strftime("%H:%M")
    match = baseline_df[(baseline_df["day_of_week"] == day_of_week) & (baseline_df["time_of_day"] == time_of_day)]
    if match.empty:
        result["z_score"] = 0.0
        result["is_anomaly"] = False
        return result

    row = match.iloc[0]
    baseline_mean = float(row["baseline_mean"] or 0.0)
    baseline_std = float(row["baseline_std"] or 0.0)
    epsilon = 1e-6
    z_score = (float(consumption) - baseline_mean) / max(baseline_std, epsilon)
    result["z_score"] = z_score
    result["is_anomaly"] = abs(z_score) > z_threshold
    return result


def simulate_live_feed(
    meter_id: str,
    df_3min: pd.DataFrame,
    baseline_df: pd.DataFrame,
    delay_seconds: float = 0.1,
) -> Generator[dict, None, None]:
    """Yield annotated live readings in timestamp order for one household.

    Args:
        meter_id: Household or meter identifier to filter on.
        df_3min: Raw 3-minute DataFrame with timestamp, consumption_kwh, and meter.
        baseline_df: Output of build_time_of_day_baseline().
        delay_seconds: Pause between yielded readings to simulate streaming.

    Yields:
        Annotated reading dicts with z_score and is_anomaly fields.
    """
    if df_3min.empty:
        return

    frame = df_3min.copy()
    frame["timestamp"] = pd.to_datetime(frame.get("timestamp"), errors="coerce")
    frame["meter"] = frame.get("meter").astype(str)
    frame = frame[frame["meter"] == str(meter_id)].dropna(subset=["timestamp"]).sort_values("timestamp")

    for _, row in frame.iterrows():
        yield detect_live_anomaly(row.to_dict(), baseline_df)
        time.sleep(delay_seconds)


def detect_power_quality_anomaly(
    reading: dict,
    voltage_range: tuple = (220, 250),
    freq_tolerance: float = 1.0,
    nominal_freq: float = 50.0,
) -> dict:
    """Flag a reading when voltage or frequency move outside acceptable bounds.

    Args:
        reading: A dict containing voltage_v and frequency_hz values.
        voltage_range: Inclusive acceptable voltage range.
        freq_tolerance: Allowed deviation from nominal frequency.
        nominal_freq: Expected mains frequency in Hz.

    Returns:
        The input reading dict with power_quality_flag added.
    """
    result = dict(reading)
    voltage = pd.to_numeric(pd.Series([result.get("voltage_v")]), errors="coerce").iloc[0]
    frequency = pd.to_numeric(pd.Series([result.get("frequency_hz")]), errors="coerce").iloc[0]
    result["power_quality_flag"] = (
        pd.isna(voltage)
        or pd.isna(frequency)
        or voltage < voltage_range[0]
        or voltage > voltage_range[1]
        or abs(float(frequency) - nominal_freq) > freq_tolerance
    )
    return result


def forecast_and_detect(meter_id: str, df: pd.DataFrame, forecast_hours: int = 24) -> pd.DataFrame:
    """Convenience helper that forecasts a household and flags hourly anomalies."""
    forecast = forecast_household(meter_id, df, forecast_hours)
    hourly = (
        df.copy()
        .assign(ds=lambda frame: pd.to_datetime(frame.get("timestamp"), errors="coerce"))
        .assign(y=lambda frame: pd.to_numeric(frame.get("consumption_kwh"), errors="coerce"))
        .dropna(subset=["ds", "y", "meter"])
    )
    hourly = hourly[hourly["meter"].astype(str) == str(meter_id)]
    hourly = hourly.set_index("ds").resample("h")["y"].sum().reset_index()
    return detect_hourly_anomalies(hourly, forecast)