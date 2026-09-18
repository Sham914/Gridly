import pandas as pd

from backend.models.forecasting import forecast_household


def test_forecast_household_accepts_processed_hourly_data():
    df = pd.read_csv("backend/data/processed/BR49/br49_hourly.csv")

    forecast = forecast_household("BR49", df, forecast_hours=12)

    assert not forecast.empty
    assert {"ds", "yhat", "yhat_lower", "yhat_upper"}.issubset(set(forecast.columns))
    assert len(forecast) >= 12
