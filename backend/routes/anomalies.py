"""Anomaly detection routes."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.models.anomaly import detect_anomalies


router = APIRouter(prefix="/anomalies", tags=["anomalies"])


class AnomalyRequest(BaseModel):
    values: list[float] = Field(default_factory=list)
    threshold: float = Field(default=2.5, ge=0.1)


@router.post("/detect")
def detect(payload: AnomalyRequest) -> dict[str, object]:
    anomalies = detect_anomalies(payload.values, payload.threshold)
    return {"anomalies": [item.__dict__ for item in anomalies]}
