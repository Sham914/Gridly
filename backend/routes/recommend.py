"""Recommendation routes."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.services.recommendations import generate_recommendation_summary


router = APIRouter(prefix="/recommend", tags=["recommend"])


class RecommendationRequest(BaseModel):
    forecast: dict[str, object] | None = None
    anomalies: list[dict[str, object]] = Field(default_factory=list)
    wastage: list[dict[str, object]] = Field(default_factory=list)


@router.post("")
def recommend(payload: RecommendationRequest) -> dict[str, str]:
    summary = generate_recommendation_summary(payload.model_dump())
    return {"recommendation": summary}
