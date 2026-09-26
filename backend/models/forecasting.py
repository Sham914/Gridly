"""Forecasting utilities for household electricity consumption."""

from __future__ import annotations

import logging

import pandas as pd

try:
    from prophet import Prophet
except Exception:  # pragma: no cover - optional runtime dependency
    Prophet = None

try:
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
except Exception:  # pragma: no cover - optional runtime dependency
    ExponentialSmoothing = None


logger = logging.getLogger(__name__)


def _normalize_input_frame(df: pd.DataFrame) -> pd.DataFrame:
    """Return a copy of the input data with standardized column names."""
    rename_map: dict[str, str] = {}

    for candidate in ("timestamp", "x_Timestamp", "ds"):
        if candidate in df.columns:
            rename_map[candidate] = "ds"
            break

    for candidate in ("consumption_kwh", "t_kWh", "y"):
        if candidate in df.columns:
            rename_map[candidate] = "y"
            break

    normalized = df.rename(columns=rename_map).copy()
    missing = {"ds", "y", "meter"} - set(normalized.columns)
    if missing:
        raise ValueError(f"Input DataFrame is missing required columns: {sorted(missing)}")

    normalized["ds"] = pd.to_datetime(normalized["ds"], errors="coerce")
    normalized["y"] = pd.to_numeric(normalized["y"], errors="coerce")
    normalized = normalized.dropna(subset=["ds", "y", "meter"])
    return normalized


def _prepare_hourly_series(meter_id: str, df: pd.DataFrame) -> pd.DataFrame:
    """Filter one meter and aggregate 3-minute readings into hourly totals."""
    normalized = _normalize_input_frame(df)
    household = normalized[normalized["meter"].astype(str) == str(meter_id)].copy()
    if household.empty:
        raise ValueError(f"No rows found for meter_id={meter_id!r}")

    hourly = (
        household.sort_values("ds")
        .set_index("ds")
        .resample("h")["y"]
        .sum()
        .reset_index()
    )
    hourly = hourly.dropna(subset=["ds", "y"])
    return hourly


def _add_manual_interval_bounds(forecast: pd.DataFrame, residual_std: float) -> pd.DataFrame:
    """Add rough confidence bounds around the point forecast."""
    result = forecast.copy()
    delta = 1.96 * residual_std
    result["yhat_lower"] = (result["yhat"] - delta).clip(lower=0)
    result["yhat_upper"] = (result["yhat"] + delta).clip(lower=0)
    result["yhat"] = result["yhat"].clip(lower=0)
    return result


def forecast_household(meter_id: str, df: pd.DataFrame, forecast_hours: int = 24) -> pd.DataFrame:
    """Forecast hourly electricity consumption for one household using Prophet.

    Args:
        meter_id: Household or meter identifier to forecast.
        df: Raw input DataFrame containing timestamp, consumption, and meter columns.
        forecast_hours: Number of future hourly steps to forecast.

    Returns:
        A DataFrame containing at least ds, yhat, yhat_lower, and yhat_upper for the
        historical period plus the requested future horizon.
    """
    if Prophet is None:
        raise ImportError("prophet is not installed")

    hourly = _prepare_hourly_series(meter_id, df)
    model = Prophet(daily_seasonality=True, weekly_seasonality=True, yearly_seasonality=False)
    model.fit(hourly[["ds", "y"]])

    future = model.make_future_dataframe(periods=forecast_hours, freq="h")
    forecast = model.predict(future)
    forecast["yhat"] = forecast["yhat"].clip(lower=0)
    forecast["yhat_lower"] = forecast["yhat_lower"].clip(lower=0)
    forecast["yhat_upper"] = forecast["yhat_upper"].clip(lower=0)
    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]


def forecast_household_fallback(meter_id: str, df: pd.DataFrame, forecast_hours: int = 24) -> pd.DataFrame:
    """Forecast hourly electricity consumption using Holt-Winters ExponentialSmoothing.

    Args:
        meter_id: Household or meter identifier to forecast.
        df: Raw input DataFrame containing timestamp, consumption, and meter columns.
        forecast_hours: Number of future hourly steps to forecast.

    Returns:
        A DataFrame containing at least ds, yhat, yhat_lower, and yhat_upper for the
        requested future horizon. Confidence bounds are estimated from in-sample residuals.
    """
    if ExponentialSmoothing is None:
        raise ImportError("statsmodels is not installed")

    hourly = _prepare_hourly_series(meter_id, df)
    series = hourly.set_index("ds")["y"].astype(float)
    if len(series) < 2:
        raise ValueError("Not enough hourly observations to build a fallback forecast")

    seasonal_periods = 24
    use_seasonal = len(series) >= seasonal_periods * 2

    if use_seasonal:
        model = ExponentialSmoothing(
            series,
            trend="add",
            seasonal="add",
            seasonal_periods=seasonal_periods,
            initialization_method="estimated",
        )
    else:
        model = ExponentialSmoothing(
            series,
            trend="add",
            seasonal=None,
            initialization_method="estimated",
        )

    fitted = model.fit(optimized=True)
    forecast_values = fitted.forecast(forecast_hours)
    residuals = (series - fitted.fittedvalues).dropna()
    residual_std = float(residuals.std(ddof=1)) if len(residuals) > 1 else 0.0

    forecast_index = pd.date_range(
        start=series.index.max() + pd.Timedelta(hours=1),
        periods=forecast_hours,
        freq="h",
    )
    forecast = pd.DataFrame({"ds": forecast_index, "yhat": forecast_values.to_numpy()})
    forecast = _add_manual_interval_bounds(forecast, residual_std)
    return forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]]


def get_forecast(meter_id: str, df: pd.DataFrame, forecast_hours: int = 24) -> pd.DataFrame:
    """Return a household forecast using Prophet first and Holt-Winters as fallback.

    Args:
        meter_id: Household or meter identifier to forecast.
        df: Raw input DataFrame containing timestamp, consumption, and meter columns.
        forecast_hours: Number of future hourly steps to forecast.

    Returns:
        A DataFrame containing at least ds, yhat, yhat_lower, and yhat_upper.
        Logs which forecasting method was used.
    """
    try:
        forecast = forecast_household(meter_id, df, forecast_hours)
        logger.info("Generated forecast for meter_id=%s using Prophet", meter_id)
        return forecast
    except Exception:
        logger.exception(
            "Prophet forecast failed for meter_id=%s; falling back to Holt-Winters",
            meter_id,
        )
        forecast = forecast_household_fallback(meter_id, df, forecast_hours)
        logger.info("Generated forecast for meter_id=%s using Holt-Winters fallback", meter_id)
        return forecast