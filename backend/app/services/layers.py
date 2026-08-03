"""
Stage 01
Step 01

Purpose:
Defines the registry of map layers and reads their data from Neo4j (as of
Stage 07 — previously read the CSVs directly; see graph_ingest.py for the
ETL that loaded them in). Converts POI nodes back into GeoJSON Point
features for the frontend, so the API contract is unchanged from Stage 1-6.
"""

import json
import os
from dataclasses import dataclass, field

from app.services.db import driver

DATA_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "..", "data")
)

# Lagos State, Nigeria bounding box. Source OSM exports were contaminated with a
# small number of stray Lagos-Portugal (Algarve) records; anything outside this
# box is dropped at ingestion time so the map stays focused on Lagos, Nigeria.
LAGOS_NG_BOUNDS = {"min_lon": 2.5, "max_lon": 4.5, "min_lat": 6.0, "max_lat": 6.8}


@dataclass
class LayerDef:
    id: str
    label: str
    category: str
    color: str
    icon: str
    default_visible: bool = False
    folder: str = field(default="")

    def __post_init__(self):
        if not self.folder:
            self.folder = self.id


LAYERS: list[LayerDef] = [
    # Transport
    LayerDef("bus_stops", "Bus Stops", "Transport", "#2563eb", "bus"),
    LayerDef("bus_stations", "Bus Stations", "Transport", "#1d4ed8", "bus-station"),
    LayerDef("railway_stations", "Railway Stations", "Transport", "#7c3aed", "train"),
    LayerDef("ferry_terminals", "Ferry Terminals", "Transport", "#0891b2", "ferry"),
    LayerDef("bridges", "Bridges", "Transport", "#64748b", "bridge"),
    # Health
    LayerDef("hospitals", "Hospitals", "Health", "#dc2626", "hospital", default_visible=True),
    LayerDef("clinics", "Clinics", "Health", "#f97316", "clinic"),
    # Education
    LayerDef("schools", "Schools", "Education", "#16a34a", "school"),
    LayerDef("universities", "Universities", "Education", "#15803d", "university"),
    LayerDef("colleges", "Colleges", "Education", "#22c55e", "college"),
    # Safety & Civic
    LayerDef("police_stations", "Police Stations", "Civic & Safety", "#1e40af", "police"),
    LayerDef("fire_stations", "Fire Stations", "Civic & Safety", "#b91c1c", "fire"),
    LayerDef("government_offices", "Government Offices", "Civic & Safety", "#525252", "government"),
    LayerDef("banks", "Banks", "Civic & Safety", "#0f766e", "bank"),
    # Tourism & Heritage
    LayerDef("heritage_sites", "Heritage Sites", "Tourism & Heritage", "#a16207", "heritage"),
    LayerDef("museums", "Museums", "Tourism & Heritage", "#92400e", "museum"),
    LayerDef("hotels", "Hotels", "Tourism & Heritage", "#c026d3", "hotel"),
    LayerDef("trail_waypoints_and_attractions", "Trails & Attractions", "Tourism & Heritage", "#65a30d", "trail"),
]

LAYERS_BY_ID = {layer.id: layer for layer in LAYERS}


def get_layer(layer_id: str) -> LayerDef | None:
    return LAYERS_BY_ID.get(layer_id)


def _poi_to_feature(record) -> dict:
    p = record["p"]
    return {
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [p["lon"], p["lat"]]},
        "properties": json.loads(p["properties"]),
    }


def read_layer_geojson(layer: LayerDef) -> dict:
    query = """
    MATCH (p:POI)-[:IN_CATEGORY]->(:Category {id: $categoryId})
    RETURN p
    """
    with driver.session() as session:
        records = session.run(query, categoryId=layer.id)
        features = [_poi_to_feature(r) for r in records]
    return {"type": "FeatureCollection", "features": features}


def layer_feature_count(layer: LayerDef) -> int:
    query = """
    MATCH (p:POI)-[:IN_CATEGORY]->(:Category {id: $categoryId})
    RETURN count(p) AS count
    """
    with driver.session() as session:
        record = session.run(query, categoryId=layer.id).single()
        return record["count"] if record else 0


def search_all(query: str, limit: int = 30) -> list[dict]:
    """
    Stage 02
    Step 01
    (Updated Stage 07 to query the graph instead of scanning CSVs.)

    Purpose:
    Searches every POI's name for a case-insensitive match, ranking
    exact-prefix matches above mid-string matches.
    """
    q = query.strip().lower()
    if not q:
        return []

    cypher = """
    MATCH (p:POI)-[:IN_CATEGORY]->(c:Category)
    WHERE toLower(p.name) CONTAINS $q
    RETURN p, c, toLower(p.name) STARTS WITH $q AS isPrefix
    ORDER BY isPrefix DESC
    LIMIT $limit
    """
    with driver.session() as session:
        records = session.run(cypher, q=q, limit=limit)
        return [
            {
                "name": r["p"]["name"],
                "layerId": r["c"]["id"],
                "layerLabel": r["c"]["label"],
                "color": r["c"]["color"],
                "lon": r["p"]["lon"],
                "lat": r["p"]["lat"],
                "properties": json.loads(r["p"]["properties"]),
            }
            for r in records
        ]


def nearby_pois(lon: float, lat: float, radius_m: float = 500, limit: int = 10) -> list[dict]:
    """
    Stage 07
    Step 02

    Purpose:
    "What's near this point" — the payoff of having a real graph instead of
    flat CSVs. Computed at query time with Neo4j's native point.distance()
    (geodesic, in meters) rather than precomputed NEAR edges: with ~3,100
    POIs, materializing every pairwise NEAR relationship would be a huge,
    mostly-useless edge explosion. A live spatial query scales better and
    always reflects the current radius the caller asks for.
    """
    query = """
    MATCH (p:POI)-[:IN_CATEGORY]->(c:Category)
    WITH p, c, point.distance(
        point({longitude: p.lon, latitude: p.lat, crs: 'wgs-84'}),
        point({longitude: $lon, latitude: $lat, crs: 'wgs-84'})
    ) AS distanceMeters
    WHERE distanceMeters <= $radius
    RETURN p, c, distanceMeters
    ORDER BY distanceMeters ASC
    LIMIT $limit
    """
    with driver.session() as session:
        records = session.run(query, lon=lon, lat=lat, radius=radius_m, limit=limit)
        return [
            {
                "name": r["p"]["name"],
                "layerId": r["c"]["id"],
                "layerLabel": r["c"]["label"],
                "color": r["c"]["color"],
                "lon": r["p"]["lon"],
                "lat": r["p"]["lat"],
                "properties": json.loads(r["p"]["properties"]),
                "distanceMeters": round(r["distanceMeters"], 1),
            }
            for r in records
        ]
