"""Wastage detection routes."""

from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, Field

from backend.models.wastage import detect_wastage


router = APIRouter(prefix="/wastage", tags=["wastage"])


class WastageRequest(BaseModel):
	values: list[float] = Field(default_factory=list)
	reorder_point: float = Field(default=10.0, ge=0.0)


@router.post("/detect")
def detect(payload: WastageRequest) -> dict[str, object]:
	findings = detect_wastage(payload.values, payload.reorder_point)
	return {"findings": [finding.__dict__ for finding in findings]}
