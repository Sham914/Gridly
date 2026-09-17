from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/usage", tags=["usage"])

DEFAULT_DATASET_PATH = Path(__file__).resolve().parents[1] / "notebooks" / "data.csv"
DATASET_PATH = Path(__import__("os").getenv("DATASET_PATH", DEFAULT_DATASET_PATH))

# Load once at startup, not on every request.
if not DATASET_PATH.exists():
    raise FileNotFoundError(f"Usage dataset not found: {DATASET_PATH}")

df = pd.read_csv(DATASET_PATH, parse_dates=["x_Timestamp"])
df = df.rename(
    columns={
        "x_Timestamp": "timestamp",
        "t_kWh": "kwh",
    }
)


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
    household = df[df["meter"] == meter].copy()

    if household.empty:
        raise HTTPException(status_code=404, detail=f"No data found for meter '{meter}'")

    if start:
        household = household[household["timestamp"] >= pd.to_datetime(start)]
    if end:
        household = household[household["timestamp"] <= pd.to_datetime(end)]

    household = household.sort_values("timestamp")

    if limit:
        household = household.tail(limit)

    return household[["timestamp", "kwh"]].to_dict(orient="records")