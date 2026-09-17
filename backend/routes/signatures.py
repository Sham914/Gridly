from fastapi import APIRouter
import pandas as pd
from models.load_signature import extract_features, cluster_load_signatures

router = APIRouter()

@router.get("/signatures")
def get_signatures():
    df = pd.read_csv("data/processed/BR49/br49_3min.csv")
    df = extract_features(df)
    df = cluster_load_signatures(df)
    return df[["timestamp", "consumption_kwh", "cluster_label"]].to_dict(orient="records")