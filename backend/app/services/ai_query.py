"""
Stage 08
Step 01

Purpose:
The AI Query Interpreter: a user's plain-English question -> an LLM
translates it into Cypher -> the query runs against the Stage 07 knowledge
graph -> results are formatted back into a plain-language answer.

Locally this is Ollama (free/offline — see Section 5's "free technologies
only" rule). Render's free tier has no RAM for a local model server, so the
deployed backend instead points LLM_PROVIDER at Groq's free-tier hosted API
(Stage 12) — same prompt, same validation, only where the Cypher text is
generated from differs.

Security-by-design: the schema shown to the model, and the queries it's
allowed to run, are restricted to the public POI/Category/LGA graph only.
User accounts, saved places, and citizen reports are never mentioned in the
prompt and are defended against below even if the model tried anyway.
"""

import re

import requests

from app.config import GROQ_API_KEY, GROQ_MODEL, GROQ_URL, LLM_PROVIDER, OLLAMA_MODEL, OLLAMA_URL
from app.services.db import driver
from app.services.graph_ingest import LGA_CENTROIDS
from app.services.layers import LAYERS

CATEGORY_IDS = ", ".join(f'"{layer.id}"' for layer in LAYERS)
LGA_NAMES = ", ".join(f'"{name}"' for name in LGA_CENTROIDS)

SYSTEM_PROMPT = f"""You are a Cypher query generator for a read-only Neo4j graph about points of interest (POIs) in Lagos, Nigeria.

Schema (this is the ONLY data that exists — do not invent labels, properties, or relationships):
- (:POI {{id, name, lon, lat}}) — a point of interest.
- (:Category {{id, label}}) — id is one of: {CATEGORY_IDS}
- (:LGA {{name}}) — name is one of: {LGA_NAMES}
- (:POI)-[:IN_CATEGORY]->(:Category)
- (:POI)-[:LOCATED_IN]->(:LGA)

Rules:
- Output ONLY one Cypher query. No explanation, no markdown fences, no commentary — just the query.
- Read-only. Only MATCH, WHERE, WITH, RETURN, ORDER BY, LIMIT, count(), collect(). NEVER CREATE, MERGE, SET, DELETE, REMOVE, DROP, or CALL.
- Any query returning individual POIs must end with LIMIT 25 or less.
- Category ids and LGA names are exact strings — match them exactly as listed above.

Important distinction: if the question asks for a single total (no mention
of "each", "which area/LGA", "breakdown", or "most/least"), return ONE
overall count — do not group by LGA. Only group by LGA when the question
explicitly asks for a per-area breakdown or comparison.

Examples:

Q: How many hospitals are there?
MATCH (p:POI)-[:IN_CATEGORY]->(:Category {{id: "hospitals"}}) RETURN count(p) AS count

Q: How many banks are there in total?
MATCH (p:POI)-[:IN_CATEGORY]->(:Category {{id: "banks"}}) RETURN count(p) AS count

Q: List schools in Ikeja
MATCH (p:POI)-[:IN_CATEGORY]->(:Category {{id: "schools"}}), (p)-[:LOCATED_IN]->(:LGA {{name: "Ikeja"}}) RETURN p.name AS name, p.lon AS lon, p.lat AS lat LIMIT 25

Q: How many banks are in each LGA?
MATCH (p:POI)-[:IN_CATEGORY]->(:Category {{id: "banks"}}), (p)-[:LOCATED_IN]->(l:LGA) RETURN l.name AS lga, count(p) AS count ORDER BY count DESC

Q: Which LGA has the most hospitals?
MATCH (p:POI)-[:IN_CATEGORY]->(:Category {{id: "hospitals"}}), (p)-[:LOCATED_IN]->(l:LGA) RETURN l.name AS lga, count(p) AS count ORDER BY count DESC LIMIT 1

Now the real question. Output ONLY the Cypher query, nothing else.

Q: {{question}}
"""

FORBIDDEN = re.compile(
    r"\b(CREATE|MERGE|SET|DELETE|REMOVE|DROP|CALL|LOAD\s+CSV|DETACH)\b", re.IGNORECASE
)
# Matches node-label syntax — "(p:POI" or "(:Category" — not relationship
# types, which look like "[:IN_CATEGORY]" and must not be flagged here.
NODE_LABEL_PATTERN = re.compile(r"\(\s*\w*\s*:\s*(\w+)")
ALLOWED_LABEL_SET = {"POI", "Category", "LGA"}


class UnsafeQueryError(Exception):
    pass


def _extract_cypher(raw: str) -> str:
    text = raw.strip()
    text = re.sub(r"^```(?:cypher)?\s*|\s*```$", "", text, flags=re.IGNORECASE).strip()
    # Some small models echo "Cypher:" or similar before the query.
    lines = [l for l in text.splitlines() if l.strip()]
    return "\n".join(lines).strip()


def _validate_cypher(cypher: str) -> None:
    if not cypher or not cypher.upper().startswith("MATCH"):
        raise UnsafeQueryError("Model did not return a MATCH query.")
    if FORBIDDEN.search(cypher):
        raise UnsafeQueryError("Generated query contained a write/admin keyword.")
    labels = set(NODE_LABEL_PATTERN.findall(cypher))
    if not labels.issubset(ALLOWED_LABEL_SET):
        raise UnsafeQueryError(f"Generated query referenced disallowed labels: {labels - ALLOWED_LABEL_SET}")


def _generate_cypher_ollama(prompt: str) -> str:
    response = requests.post(
        f"{OLLAMA_URL}/api/generate",
        json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "options": {"temperature": 0},
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["response"]


def _generate_cypher_groq(prompt: str) -> str:
    response = requests.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {GROQ_API_KEY}"},
        json={
            "model": GROQ_MODEL,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0,
        },
        timeout=30,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def generate_cypher(question: str, retry_hint: str = "") -> str:
    prompt = SYSTEM_PROMPT.replace("{question}", question)
    if retry_hint:
        prompt += f"\n\n{retry_hint}\n\nQ: {question}\n"
    raw = _generate_cypher_groq(prompt) if LLM_PROVIDER == "groq" else _generate_cypher_ollama(prompt)
    return _extract_cypher(raw)


def _run_read_query(cypher: str) -> list[dict]:
    def _tx(tx):
        result = tx.run(cypher)
        return [dict(record) for record in result]

    with driver.session() as session:
        return session.execute_read(_tx)


def _format_answer(rows: list[dict]) -> str:
    if not rows:
        return "I couldn't find anything matching that."

    keys = list(rows[0].keys())

    if len(rows) == 1 and "count" in keys and len(keys) == 1:
        return f"That's {rows[0]['count']}."

    if "count" in keys and len(keys) == 2:
        label_key = next(k for k in keys if k != "count")
        lines = [f"- {r[label_key]}: {r['count']}" for r in rows[:15]]
        return "Here's the breakdown:\n" + "\n".join(lines)

    if "name" in keys:
        names = [r["name"] for r in rows if r.get("name")]
        if not names:
            return f"Found {len(rows)} result(s), but none had a name on record."
        listed = "\n".join(f"- {n}" for n in names[:25])
        return f"Found {len(names)} result(s):\n{listed}"

    return f"Found {len(rows)} result(s)."


def ask_question(question: str) -> dict:
    """
    One retry on failure: small local models occasionally produce an
    invalid or malformed query. Rather than fail the whole question on the
    first miss, we give the model one corrective second attempt before
    giving up — this measurably improves reliability without a bigger model.
    """
    try:
        cypher = generate_cypher(question)
        _validate_cypher(cypher)
        rows = _run_read_query(cypher)
    except Exception:
        cypher = generate_cypher(
            question,
            retry_hint=(
                "Your previous answer was invalid — it must be exactly one "
                "read-only MATCH...RETURN query using only POI, Category, "
                "and LGA, following the examples precisely."
            ),
        )
        _validate_cypher(cypher)
        rows = _run_read_query(cypher)

    answer = _format_answer(rows)

    # Keep coordinates (if present) so the frontend can highlight results on
    # the map, without dumping the full row set into the chat text.
    map_points = [
        {"name": r.get("name"), "lon": r["lon"], "lat": r["lat"]}
        for r in rows
        if "lon" in r and "lat" in r and r.get("lon") is not None
    ]

    return {
        "question": question,
        "cypher": cypher,
        "answer": answer,
        "resultCount": len(rows),
        "mapPoints": map_points,
    }
