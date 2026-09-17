"""Rule-based wastage detection helpers."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence


@dataclass(frozen=True)
class WastageFinding:
    index: int
    severity: str
    reason: str


def detect_wastage(values: Sequence[float], reorder_point: float = 10.0) -> list[WastageFinding]:
    findings: list[WastageFinding] = []
    for index, value in enumerate(float(item) for item in values):
        if value <= 0:
            findings.append(WastageFinding(index=index, severity="high", reason="Zero or negative usage"))
        elif value < reorder_point * 0.25:
            findings.append(WastageFinding(index=index, severity="medium", reason="Very low usage"))
    return findings

def detect_phantom_load(df: pd.DataFrame):
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    night = df[df["timestamp"].dt.hour.between(2, 4)]
    daily_baseline = night.groupby(night["timestamp"].dt.date)["consumption_kwh"].mean()
    yearly_median = daily_baseline.median()
    return {
        "yearly_night_baseline_kwh": round(yearly_median, 4),
        "daily_series": daily_baseline.reset_index().rename(
            columns={"timestamp": "date", "consumption_kwh": "night_avg_kwh"}
        ).to_dict(orient="records"),
    }