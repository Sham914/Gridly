"""FastAPI entrypoint for the Nexora backend service."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.routes.anomalies import router as anomalies_router
from backend.routes.predict import router as predict_router
from backend.routes.recommend import router as recommend_router
from backend.routes.usages import router as usage_router
from backend.routes.wastage import router as wastage_router

app = FastAPI(title="Nexora AI Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(predict_router)
app.include_router(anomalies_router)
app.include_router(usage_router)
app.include_router(wastage_router)
app.include_router(recommend_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "nexora-backend"}

@app.get("/")
def main():
    return {"service": "nexora-backend"}
