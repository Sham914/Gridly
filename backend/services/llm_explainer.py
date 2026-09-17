import os
from groq import Groq

client = Groq(api_key=os.environ["GROQ_API_KEY"])

def explain_anomaly(anomaly: dict) -> str:
    prompt = f"""You are an energy analyst. Given this detected anomaly, write a 2-sentence
plain-language explanation and one practical suggestion. Avoid jargon.

Anomaly data: {anomaly}"""
    resp = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        max_tokens=200,
        messages=[{"role": "user", "content": prompt}],
    )
    return resp.choices[0].message.content