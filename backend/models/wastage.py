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
