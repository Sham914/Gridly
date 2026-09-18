"""Recommendation generation helpers."""

from __future__ import annotations

import os
from typing import Any

from backend.services.llm_explainer import explain_anomaly


def generate_recommendation_summary(context: dict[str, Any]) -> str:
    items: list[str] = []
    forecast = context.get("forecast")
    anomalies = context.get("anomalies") or []
    wastage = context.get("wastage") or []

    if forecast:
        items.append("forecast reviewed")
    if anomalies:
        items.append("anomalies flagged")
    if wastage:
        items.append("wastage rules triggered")

    if anomalies:
        first_anomaly = anomalies[0]
        if isinstance(first_anomaly, dict):
            return explain_anomaly(first_anomaly)

    model_name = os.getenv("LLM_MODEL", "fallback-rule-based")
    if not items:
        return f"No strong signals detected. Default model: {model_name}."

    return (
        f"The current pattern suggests {', '.join(items)}. "
        "Prioritize the highest-usage hours, inspect any irregular spikes, and trim avoidable loads to reduce cost."
    )
