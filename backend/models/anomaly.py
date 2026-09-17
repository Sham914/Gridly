"""Anomaly detection helpers."""

from __future__ import annotations

from dataclasses import dataclass
from statistics import mean, pstdev
from typing import Sequence


@dataclass(frozen=True)
class AnomalyResult:
    index: int
    value: float
    score: float


def detect_anomalies(values: Sequence[float], threshold: float = 2.5) -> list[AnomalyResult]:
    numeric_values = [float(value) for value in values]
    if len(numeric_values) < 2:
        return []

    average = mean(numeric_values)
    deviation = pstdev(numeric_values)
    if deviation == 0:
        return []

    anomalies: list[AnomalyResult] = []
    for index, value in enumerate(numeric_values):
        score = abs((value - average) / deviation)
        if score >= threshold:
            anomalies.append(AnomalyResult(index=index, value=value, score=round(score, 3)))
    return anomalies
