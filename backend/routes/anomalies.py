"""Anomaly detection routes."""

from __future__ import annotations

import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.models.anomaly_detection import detect_hourly_anomalies


router = APIRouter(prefix="/anomalies", tags=["anomalies"])


class AnomalyRequest(BaseModel):
    actual_hourly_df: list[dict] = Field(default_factory=list)
    forecast_df: list[dict] = Field(default_factory=list)


@router.post("/detect")
def detect(payload: AnomalyRequest) -> dict[str, object]:
    actual = pd.DataFrame(payload.actual_hourly_df)
    forecast = pd.DataFrame(payload.forecast_df)
    anomalies = detect_hourly_anomalies(actual, forecast)
    return {"anomalies": anomalies.to_dict(orient="records")}
