import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler

def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["s_kva"] = (df["voltage_v"] * df["current_a"]) / 1000
    df["p_avg_kw"] = df["consumption_kwh"] * 20  # 3-min interval → kW
    df["pf_est"] = (df["p_avg_kw"] / df["s_kva"]).clip(upper=1.0)
    df["hour"] = df["timestamp"].dt.hour
    df["is_weekend"] = df["timestamp"].dt.dayofweek >= 5
    return df

def cluster_load_signatures(df: pd.DataFrame, n_clusters: int = 5):
    features = df[["consumption_kwh", "current_a", "pf_est", "hour"]].fillna(0)
    scaled = StandardScaler().fit_transform(features)
    km = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    df["cluster_id"] = km.fit_predict(scaled)

    # label by centroid characteristics, sorted by mean kwh
    stats = df.groupby("cluster_id")[["consumption_kwh", "pf_est"]].mean().sort_values("consumption_kwh")
    labels = ["Baseline/Standby", "Moderate Load", "High Load", "Persistent High Load", "Sudden Spike"]
    label_map = {cid: labels[i] for i, cid in enumerate(stats.index)}
    # override: low PF + high kwh → motor-type
    for cid, row in stats.iterrows():
        if row["consumption_kwh"] > stats["consumption_kwh"].median() and row["pf_est"] < 0.85:
            label_map[cid] = "Motor-like/Inductive Load"

    df["cluster_label"] = df["cluster_id"].map(label_map)
    return df