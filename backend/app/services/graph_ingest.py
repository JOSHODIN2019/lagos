"""
Stage 07
Step 01

Purpose:
One-time ETL: reads the 18 layer CSVs (the same files Stage 1-6 served
directly) and loads them into Neo4j as a real graph — (:POI) nodes linked to
(:Category) and (:LGA) nodes. This is what `layers.py` queries from now on;
the CSVs remain on disk as the source-of-truth export, but are no longer
read at request time.

Scoping note on (:LGA): Lagos State's 20 LGAs don't have boundary polygon
data available anywhere in this project's dataset (only OSM points, no
administrative boundary shapes). Assigning a POI to an LGA here is a
**nearest-centroid heuristic** — straight-line distance to each LGA's
approximate center point — not a true point-in-polygon boundary lookup.
It's a reasonable approximation for a demo civic app, but it is exactly
that: approximate, and occasionally wrong near LGA borders. Documented here
and in ARCHITECTURE.md rather than presented as authoritative.
"""

import csv
import json
import os
import uuid

from app.services.db import driver
from app.services.layers import LAGOS_NG_BOUNDS, LAYERS, DATA_DIR, LayerDef

# Approximate centroids (lon, lat) for Lagos State's 20 LGAs. General
# geographic knowledge, not surveyed data — see module docstring.
LGA_CENTROIDS: dict[str, tuple[float, float]] = {
    "Agege": (3.3244, 6.6018),
    "Ajeromi-Ifelodun": (3.3350, 6.4550),
    "Alimosho": (3.2450, 6.6050),
    "Amuwo-Odofin": (3.2980, 6.4630),
    "Apapa": (3.3590, 6.4485),
    "Badagry": (2.8810, 6.4160),
    "Epe": (3.9850, 6.5830),
    "Eti-Osa": (3.4700, 6.4500),
    "Ibeju-Lekki": (3.9200, 6.4700),
    "Ifako-Ijaiye": (3.2980, 6.6700),
    "Ikeja": (3.3450, 6.6018),
    "Ikorodu": (3.5080, 6.6190),
    "Kosofe": (3.3850, 6.5850),
    "Lagos Island": (3.3950, 6.4550),
    "Lagos Mainland": (3.3800, 6.4980),
    "Mushin": (3.3480, 6.5330),
    "Ojo": (3.1580, 6.4630),
    "Oshodi-Isolo": (3.3080, 6.5450),
    "Shomolu": (3.3800, 6.5390),
    "Surulere": (3.3550, 6.4950),
}


def nearest_lga(lon: float, lat: float) -> str:
    return min(
        LGA_CENTROIDS,
        key=lambda name: (LGA_CENTROIDS[name][0] - lon) ** 2
        + (LGA_CENTROIDS[name][1] - lat) ** 2,
    )


def ensure_poi_constraints() -> None:
    with driver.session() as session:
        session.run(
            "CREATE CONSTRAINT poi_id_unique IF NOT EXISTS "
            "FOR (p:POI) REQUIRE p.id IS UNIQUE"
        )
        session.run(
            "CREATE CONSTRAINT category_id_unique IF NOT EXISTS "
            "FOR (c:Category) REQUIRE c.id IS UNIQUE"
        )
        session.run(
            "CREATE CONSTRAINT lga_name_unique IF NOT EXISTS "
            "FOR (l:LGA) REQUIRE l.name IS UNIQUE"
        )


def _read_csv_rows(layer: LayerDef) -> list[dict]:
    csv_path = os.path.join(DATA_DIR, layer.folder, f"{layer.folder}.csv")
    rows = []
    if not os.path.exists(csv_path):
        return rows

    with open(csv_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            lon = row.pop("lon", None)
            lat = row.pop("lat", None)
            row.pop("geom_type", None)
            if not lon or not lat:
                continue
            try:
                lon_f, lat_f = float(lon), float(lat)
            except ValueError:
                continue
            b = LAGOS_NG_BOUNDS
            if not (b["min_lon"] <= lon_f <= b["max_lon"] and b["min_lat"] <= lat_f <= b["max_lat"]):
                continue
            properties = {k: v for k, v in row.items() if v not in (None, "")}
            rows.append({"lon": lon_f, "lat": lat_f, "properties": properties})
    return rows


def ingest_layer(layer: LayerDef) -> int:
    rows = _read_csv_rows(layer)
    if not rows:
        return 0

    pois = []
    for row in rows:
        name = row["properties"].get("name", layer.label)
        poi_id = str(
            uuid.uuid5(
                uuid.NAMESPACE_URL,
                f"lagos-explorer:{layer.id}:{row['lon']}:{row['lat']}:{name}",
            )
        )
        pois.append(
            {
                "id": poi_id,
                "name": name,
                "lon": row["lon"],
                "lat": row["lat"],
                "properties": json.dumps(row["properties"]),
                "lga": nearest_lga(row["lon"], row["lat"]),
            }
        )

    # ON CREATE SET only (Stage 09): a re-run of this ETL must not clobber
    # admin edits made through the Stage 09 dashboard. First ingestion is
    # authoritative; after that, the CSV is a source for *new* POIs only,
    # not a source of truth that overwrites existing ones on every run.
    query = """
    MERGE (c:Category {id: $categoryId})
    ON CREATE SET c.label = $categoryLabel, c.color = $color, c.icon = $icon
    WITH c
    UNWIND $pois AS poi
    MERGE (p:POI {id: poi.id})
    ON CREATE SET p.name = poi.name, p.lon = poi.lon, p.lat = poi.lat, p.properties = poi.properties
    MERGE (p)-[:IN_CATEGORY]->(c)
    MERGE (l:LGA {name: poi.lga})
    MERGE (p)-[:LOCATED_IN]->(l)
    """
    with driver.session() as session:
        session.run(
            query,
            categoryId=layer.id,
            categoryLabel=layer.label,
            color=layer.color,
            icon=layer.icon,
            pois=pois,
        )
    return len(pois)


def ingest_all() -> dict[str, int]:
    ensure_poi_constraints()
    counts = {}
    for layer in LAYERS:
        counts[layer.id] = ingest_layer(layer)
    return counts
