"""Prediction routes."""

from __future__ import annotations

from pathlib import Path

import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.models.forecasting import forecast_household


router = APIRouter(prefix="/predict", tags=["predict"])


def resolve_dataset_path(dataset_path: str) -> Path:
    project_root = Path(__file__).resolve().parents[1]
    candidates = [
        Path(dataset_path),
        project_root / dataset_path,
        project_root / "notebooks" / dataset_path,
        project_root / "data" / "processed" / dataset_path,
        project_root / "data" / "processed" / "BR49" / dataset_path,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return project_root / "data" / "processed" / "BR49" / "br49_hourly.csv"


class ForecastRequest(BaseModel):
    meter_id: str = Field(min_length=1)
    forecast_hours: int = Field(default=24, ge=1, le=365)
    dataset_path: str = Field(default="BR49/br49_hourly.csv")


@router.post("/forecast")
def create_forecast(payload: ForecastRequest) -> dict[str, object]:
    dataset_file = resolve_dataset_path(payload.dataset_path)
    df = pd.read_csv(dataset_file)
    forecast = forecast_household(payload.meter_id, df, payload.forecast_hours)
    return {"meter_id": payload.meter_id, "forecast": forecast.to_dict(orient="records")}
