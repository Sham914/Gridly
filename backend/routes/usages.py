from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/usage", tags=["usage"])


def resolve_dataset_path() -> Path:
    project_root = Path(__file__).resolve().parents[1]
    env_value = __import__("os").getenv("DATASET_PATH")
    candidates = [
        Path(env_value) if env_value else None,
        project_root / "data" / "processed" / "BR49" / "br49_hourly.csv",
        project_root / "data" / "processed" / "BR49" / "br49_daily.csv",
        project_root / "data" / "processed" / "BR49" / "br49_monthly.csv",
        project_root / "notebooks" / "data.csv",
    ]
    for candidate in candidates:
        if candidate is not None and candidate.exists():
            return candidate
    return project_root / "data" / "processed" / "BR49" / "br49_hourly.csv"


def load_usage_frame() -> pd.DataFrame:
    dataset_path = resolve_dataset_path()
    frame = pd.read_csv(dataset_path)

    if frame.empty:
        raise ValueError(f"Usage dataset is empty: {dataset_path}")

    if "meter" not in frame.columns and "meter_id" in frame.columns:
        frame["meter"] = frame["meter_id"]

    timestamp_col = next((c for c in ["timestamp", "x_Timestamp", "datetime", "date"] if c in frame.columns), None)
    value_col = next((c for c in ["consumption_kwh", "t_kWh", "usage_kwh", "kwh", "value"] if c in frame.columns), None)

    if timestamp_col is None or value_col is None:
        raise ValueError(
            "Unsupported usage dataset columns. Expected a timestamp and a consumption column like "
            "timestamp/consumption_kwh or x_Timestamp/t_kWh."
        )

    normalized = frame[[timestamp_col, value_col, "meter"]].copy() if "meter" in frame.columns else frame[[timestamp_col, value_col]].copy()
    normalized = normalized.rename(columns={timestamp_col: "timestamp", value_col: "kwh"})
    if "meter" not in normalized.columns:
        normalized["meter"] = "BR49"
    normalized["timestamp"] = pd.to_datetime(normalized["timestamp"], errors="coerce")
    normalized["kwh"] = pd.to_numeric(normalized["kwh"], errors="coerce")
    return normalized.dropna(subset=["timestamp", "kwh"]).sort_values("timestamp").reset_index(drop=True)


@router.get("")
def get_usage(
    meter: str = Query(..., description="Household/meter ID, e.g. BR49"),
    start: Optional[str] = Query(None, description="Start datetime, e.g. 2021-01-01T00:00:00"),
    end: Optional[str] = Query(None, description="End datetime"),
    limit: Optional[int] = Query(None, description="Max number of rows to return"),
):
    """
    Returns raw timestamp + kWh usage data for a given household,
    for chart display on the frontend.
    """
    df = load_usage_frame()
    household = df[df["meter"].astype(str).str.lower() == meter.lower()].copy()

    if household.empty:
        raise HTTPException(status_code=404, detail=f"No data found for meter '{meter}'")

    if start:
        household = household[household["timestamp"] >= pd.to_datetime(start)]
    if end:
        household = household[household["timestamp"] <= pd.to_datetime(end)]

    household = household.sort_values("timestamp")

    if limit:
        household = household.tail(limit)

    return household[["timestamp", "kwh"]].assign(timestamp=lambda row: row["timestamp"].dt.strftime("%Y-%m-%dT%H:%M:%S")).to_dict(orient="records")