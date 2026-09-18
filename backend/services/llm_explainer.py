import os
from typing import Any

from groq import Groq


GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None


def _fallback_explain_anomaly(anomaly: dict[str, Any]) -> str:
    anomaly_type = anomaly.get("type") or anomaly.get("name") or "energy anomaly"
    actual = anomaly.get("actualKwh") or anomaly.get("actual_kwh") or anomaly.get("value") or 0
    expected = anomaly.get("expectedKwh") or anomaly.get("expected_kwh") or anomaly.get("baseline") or 0
    delta = max(float(actual) - float(expected), 0) if expected else 0
    return (
        f"The system detected a {anomaly_type} event. Current usage is about {actual} kWh against an expected "
        f"range of {expected} kWh, with an excess of roughly {delta:.1f} kWh. "
        "This usually means a short-term operational spike or equipment inefficiency that is worth checking."
    )


def explain_anomaly(anomaly: dict[str, Any]) -> str:
    if client is None:
        return _fallback_explain_anomaly(anomaly)

    prompt = f"""You are an energy analyst. Given this detected anomaly, write a 2-sentence
plain-language explanation and one practical suggestion. Avoid jargon.

Anomaly data: {anomaly}"""

    try:
        model_name = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        resp = client.chat.completions.create(
            model=model_name,
            max_tokens=200,
            messages=[{"role": "user", "content": prompt}],
        )
        content = resp.choices[0].message.content
        if content:
            return content
    except Exception:
        pass

    return _fallback_explain_anomaly(anomaly)