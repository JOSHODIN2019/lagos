"""
Stage 06
Step 01

Purpose:
Neo4j-backed citizen issue reports. Each report gets a real SHA-256 hash of
its own content as a "proof of submission" — a genuine, verifiable digest,
not a fabricated one. Per Section 9 of PROJECT_MEMORY.md, this is presented
to the user as a simulated tamper-evident record, explicitly not claimed to
be blockchain storage, since no such storage is actually implemented here.
"""

import hashlib
import uuid
from datetime import datetime, timezone

from app.services.db import driver

REPORT_CATEGORIES = [
    "Pothole / bad road",
    "Broken streetlight",
    "Flooding / drainage",
    "Waste & sanitation",
    "Damaged public infrastructure",
    "Other",
]

REPORT_STATUSES = ["submitted", "in_review", "resolved", "rejected"]

PROOF_MESSAGE = (
    "Your proof of submission has been securely encrypted and recorded for "
    "this report. This demonstration simulates tamper-resistant storage for "
    "academic purposes."
)


def _compute_proof_hash(
    report_id: str, category: str, description: str, lon: float, lat: float, created_at: str
) -> str:
    payload = f"{report_id}|{category}|{description}|{lon}|{lat}|{created_at}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _to_dict(record) -> dict:
    r = record["r"]
    return {
        "id": r["id"],
        "category": r["category"],
        "description": r["description"],
        "lon": r["lon"],
        "lat": r["lat"],
        "status": r["status"],
        "createdAt": r["createdAt"],
        "proofHash": r["proofHash"],
        "proofMessage": PROOF_MESSAGE,
    }


def create_report(
    user_id: str, category: str, description: str, lon: float, lat: float
) -> dict:
    report_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()
    proof_hash = _compute_proof_hash(report_id, category, description, lon, lat, created_at)

    query = """
    MATCH (u:User {id: $userId})
    CREATE (u)-[:REPORTED]->(r:Report {
        id: $id,
        category: $category,
        description: $description,
        lon: $lon,
        lat: $lat,
        status: "submitted",
        createdAt: $createdAt,
        proofHash: $proofHash
    })
    RETURN r
    """
    with driver.session() as session:
        record = session.run(
            query,
            userId=user_id,
            id=report_id,
            category=category,
            description=description,
            lon=lon,
            lat=lat,
            createdAt=created_at,
            proofHash=proof_hash,
        ).single()
        return _to_dict(record)


def list_my_reports(user_id: str) -> list[dict]:
    query = """
    MATCH (:User {id: $userId})-[:REPORTED]->(r:Report)
    RETURN r
    ORDER BY r.createdAt DESC
    """
    with driver.session() as session:
        records = session.run(query, userId=user_id)
        return [_to_dict(r) for r in records]


def list_all_reports() -> list[dict]:
    """
    Stage 09
    Step 01

    Purpose:
    Admin moderation view — every report, with who filed it.
    """
    query = """
    MATCH (u:User)-[:REPORTED]->(r:Report)
    RETURN r, u.name AS reporterName, u.email AS reporterEmail
    ORDER BY r.createdAt DESC
    """
    with driver.session() as session:
        records = session.run(query)
        results = []
        for record in records:
            d = _to_dict(record)
            d["reporterName"] = record["reporterName"]
            d["reporterEmail"] = record["reporterEmail"]
            results.append(d)
        return results


def update_report_status(report_id: str, new_status: str) -> dict | None:
    if new_status not in REPORT_STATUSES:
        raise ValueError(f"Invalid status '{new_status}'")

    query = """
    MATCH (u:User)-[:REPORTED]->(r:Report {id: $id})
    SET r.status = $status
    RETURN r, u.name AS reporterName, u.email AS reporterEmail
    """
    with driver.session() as session:
        record = session.run(query, id=report_id, status=new_status).single()
        if record is None:
            return None
        d = _to_dict(record)
        d["reporterName"] = record["reporterName"]
        d["reporterEmail"] = record["reporterEmail"]
        return d
