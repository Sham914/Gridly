"""Prediction routes."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.models.forecasting import forecast_household


router = APIRouter(prefix="/predict", tags=["predict"])


class ForecastRequest(BaseModel):
    meter_id: str = Field(min_length=1)
    forecast_hours: int = Field(default=24, ge=1, le=365)
    dataset_path: str = Field(default="data.csv")


@router.post("/forecast")
def create_forecast(payload: ForecastRequest) -> dict[str, object]:
    dataset_file = Path(__file__).resolve().parents[1] / "notebooks" / payload.dataset_path
    df = pd.read_csv(dataset_file)
    forecast = forecast_household(payload.meter_id, df, payload.forecast_hours)
    return {"forecast": forecast.to_dict(orient="records")}
