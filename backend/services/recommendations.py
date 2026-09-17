"""Recommendation generation helpers."""

from __future__ import annotations

import os
from typing import Any


def generate_recommendation_summary(context: dict[str, Any]) -> str:
    items = []
    if context.get("forecast"):
        items.append("forecast reviewed")
    if context.get("anomalies"):
        items.append("anomalies flagged")
    if context.get("wastage"):
        items.append("wastage rules triggered")

    model_name = os.getenv("LLM_MODEL", "gpt-4o-mini")
    if not items:
        return f"No strong signals detected. Default model: {model_name}."

    return f"Insights: {', '.join(items)}. Default model: {model_name}."
