import os
from pathlib import Path
from typing import Optional

import pandas as pd
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/usage", tags=["usage"])

DEFAULT_DATASET_PATH = Path(__file__).resolve().parents[1] / "notebooks" / "data.csv"
raw_dataset_path = os.getenv("DATASET_PATH")
if raw_dataset_path:
    candidate_path = Path(raw_dataset_path).expanduser()
    if not candidate_path.is_absolute():
        candidate_path = Path.cwd() / candidate_path
    if not candidate_path.exists():
        candidate_path = Path(__file__).resolve().parents[1] / raw_dataset_path
    DATASET_PATH = candidate_path if candidate_path.exists() else DEFAULT_DATASET_PATH
else:
    DATASET_PATH = DEFAULT_DATASET_PATH

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