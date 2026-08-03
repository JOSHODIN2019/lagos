"""
Stage 05
Step 01

Purpose:
Neo4j-backed saved places — each (:User)-[:SAVED]->(:SavedPlace) edge is
scoped to that user, so the same real-world place can be saved by many
users without colliding. `key` (layerId + coordinates) is how we detect
"already saved" for a given user; Stage 07's POI graph migration will let
this point at a real Place node instead of duplicating properties.
"""

import json
import uuid
from datetime import datetime, timezone

from app.services.db import driver


def _place_key(layer_id: str, lon: float, lat: float) -> str:
    return f"{layer_id}:{lon}:{lat}"


def _to_dict(record) -> dict:
    sp = record["sp"]
    return {
        "id": sp["id"],
        "layerId": sp["layerId"],
        "layerLabel": sp["layerLabel"],
        "color": sp["color"],
        "name": sp["name"],
        "lon": sp["lon"],
        "lat": sp["lat"],
        "properties": json.loads(sp["properties"]),
        "savedAt": sp["savedAt"],
    }


def list_saved_places(user_id: str) -> list[dict]:
    query = """
    MATCH (:User {id: $userId})-[:SAVED]->(sp:SavedPlace)
    RETURN sp
    ORDER BY sp.savedAt DESC
    """
    with driver.session() as session:
        records = session.run(query, userId=user_id)
        return [_to_dict(r) for r in records]


def save_place(
    user_id: str,
    layer_id: str,
    layer_label: str,
    color: str,
    name: str,
    lon: float,
    lat: float,
    properties: dict,
) -> dict:
    key = _place_key(layer_id, lon, lat)
    query = """
    MATCH (u:User {id: $userId})
    MERGE (u)-[:SAVED]->(sp:SavedPlace {key: $key})
    ON CREATE SET
        sp.id = $id,
        sp.layerId = $layerId,
        sp.layerLabel = $layerLabel,
        sp.color = $color,
        sp.name = $name,
        sp.lon = $lon,
        sp.lat = $lat,
        sp.properties = $properties,
        sp.savedAt = $savedAt
    RETURN sp
    """
    with driver.session() as session:
        record = session.run(
            query,
            userId=user_id,
            key=key,
            id=str(uuid.uuid4()),
            layerId=layer_id,
            layerLabel=layer_label,
            color=color,
            name=name,
            lon=lon,
            lat=lat,
            properties=json.dumps(properties),
            savedAt=datetime.now(timezone.utc).isoformat(),
        ).single()
        return _to_dict(record)


def delete_saved_place(user_id: str, saved_place_id: str) -> bool:
    query = """
    MATCH (:User {id: $userId})-[r:SAVED]->(sp:SavedPlace {id: $id})
    DELETE r, sp
    RETURN count(sp) AS deleted
    """
    with driver.session() as session:
        record = session.run(query, userId=user_id, id=saved_place_id).single()
        return record["deleted"] > 0
