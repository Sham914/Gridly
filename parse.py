from pathlib import Path
import pandas as pd

# =========================
# CONFIG
# =========================

INPUT_FILE = Path(
    r"data/raw/CEEW - Smart meter data Bareilly 2020.csv"
)

OUTPUT_DIR = Path("data/processed/BR49")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

METER_ID = "BR49"


# =========================
# LOAD DATA
# =========================

print("Loading dataset...")

df = pd.read_csv(INPUT_FILE)

print("Total rows:", len(df))

# Keep BR49
df = df[df["meter"] == METER_ID].copy()

# Convert timestamp
df["timestamp"] = pd.to_datetime(df["x_Timestamp"])

# Sort chronologically
df = df.sort_values("timestamp").reset_index(drop=True)


# =========================
# RENAME COLUMNS
# =========================

df = df.rename(columns={
    "t_kWh": "consumption_kwh",
    "z_Avg Voltage (Volt)": "voltage_v",
    "z_Avg Current (Amp)": "current_a",
    "y_Freq (Hz)": "frequency_hz",
})


# Keep only useful columns
df = df[
    [
        "timestamp",
        "consumption_kwh",
        "voltage_v",
        "current_a",
        "frequency_hz",
        "meter",
    ]
]


# =========================
# SAVE 3-MINUTE DATA
# =========================

three_min_file = OUTPUT_DIR / "br49_3min.csv"

df.to_csv(three_min_file, index=False)

print("\nSaved:", three_min_file)


# =========================
# HOURLY AGGREGATION
# =========================

print("\nCreating hourly dataset...")

hourly = (
    df.set_index("timestamp")
    .resample("1h")
    .agg({
        "consumption_kwh": "sum",
        "voltage_v": "mean",
        "current_a": "mean",
        "frequency_hz": "mean",
    })
    .reset_index()
)

hourly["meter"] = METER_ID

# Calendar features
hourly["hour"] = hourly["timestamp"].dt.hour
hourly["day_of_week"] = hourly["timestamp"].dt.dayofweek
hourly["is_weekend"] = (
    hourly["day_of_week"] >= 5
).astype(int)

hourly_file = OUTPUT_DIR / "br49_hourly.csv"

hourly.to_csv(hourly_file, index=False)

print("Saved:", hourly_file)


# =========================
# DAILY AGGREGATION
# =========================

print("\nCreating daily dataset...")

daily = (
    df.set_index("timestamp")
    .resample("1D")
    .agg({
        "consumption_kwh": "sum",
        "voltage_v": "mean",
        "current_a": "mean",
        "frequency_hz": "mean",
    })
    .reset_index()
)

daily["meter"] = METER_ID

daily["day_of_week"] = daily["timestamp"].dt.dayofweek
daily["is_weekend"] = (
    daily["day_of_week"] >= 5
).astype(int)

daily_file = OUTPUT_DIR / "br49_daily.csv"

daily.to_csv(daily_file, index=False)

print("Saved:", daily_file)


# =========================
# MONTHLY AGGREGATION
# =========================

print("\nCreating monthly dataset...")

monthly = (
    df.set_index("timestamp")
    .resample("MS")
    .agg({
        "consumption_kwh": "sum",
        "voltage_v": "mean",
        "current_a": "mean",
        "frequency_hz": "mean",
    })
    .reset_index()
)

monthly["meter"] = METER_ID

monthly["year"] = monthly["timestamp"].dt.year
monthly["month"] = monthly["timestamp"].dt.month

monthly_file = OUTPUT_DIR / "br49_monthly.csv"

monthly.to_csv(monthly_file, index=False)

print("Saved:", monthly_file)


# =========================
# SUMMARY
# =========================

print("\n=========================")
print("PROCESSING COMPLETE")
print("=========================")

print("3-minute rows :", len(df))
print("Hourly rows   :", len(hourly))
print("Daily rows    :", len(daily))
print("Monthly rows  :", len(monthly))

print("\nTotal consumption:")
print("3-minute :", df["consumption_kwh"].sum())
print("Hourly   :", hourly["consumption_kwh"].sum())
print("Daily    :", daily["consumption_kwh"].sum())
print("Monthly  :", monthly["consumption_kwh"].sum())

print("\nFiles:")
print(three_min_file)
print(hourly_file)
print(daily_file)
print(monthly_file)