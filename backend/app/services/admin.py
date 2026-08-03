"""
Stage 09
Step 02

Purpose:
Admin-only capabilities: paginated/searchable POI management (edit name,
delete), and basic usage stats aggregated from the graph. Kept separate
from layers.py (the public read API) since these are privileged writes.
"""

from app.services.db import driver
from app.services.layers import LAYERS


def list_pois(
    category_id: str | None = None, q: str | None = None, limit: int = 50, offset: int = 0
) -> dict:
    where_clauses = []
    params: dict = {"limit": limit, "offset": offset}
    if category_id:
        where_clauses.append("c.id = $categoryId")
        params["categoryId"] = category_id
    if q:
        where_clauses.append("toLower(p.name) CONTAINS $q")
        params["q"] = q.strip().lower()
    where = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

    query = f"""
    MATCH (p:POI)-[:IN_CATEGORY]->(c:Category)
    {where}
    RETURN p, c
    ORDER BY p.name
    SKIP $offset LIMIT $limit
    """
    count_query = f"""
    MATCH (p:POI)-[:IN_CATEGORY]->(c:Category)
    {where}
    RETURN count(p) AS total
    """
    with driver.session() as session:
        records = session.run(query, **params)
        items = [
            {
                "id": r["p"]["id"],
                "name": r["p"]["name"],
                "lon": r["p"]["lon"],
                "lat": r["p"]["lat"],
                "layerId": r["c"]["id"],
                "layerLabel": r["c"]["label"],
                "color": r["c"]["color"],
            }
            for r in records
        ]
        total = session.run(count_query, **params).single()["total"]

    return {"items": items, "total": total}


def update_poi_name(poi_id: str, name: str) -> dict | None:
    query = """
    MATCH (p:POI {id: $id})-[:IN_CATEGORY]->(c:Category)
    SET p.name = $name
    RETURN p, c
    """
    with driver.session() as session:
        record = session.run(query, id=poi_id, name=name).single()
        if record is None:
            return None
        return {
            "id": record["p"]["id"],
            "name": record["p"]["name"],
            "lon": record["p"]["lon"],
            "lat": record["p"]["lat"],
            "layerId": record["c"]["id"],
            "layerLabel": record["c"]["label"],
            "color": record["c"]["color"],
        }


def delete_poi(poi_id: str) -> bool:
    query = """
    MATCH (p:POI {id: $id})
    DETACH DELETE p
    RETURN count(p) AS deleted
    """
    with driver.session() as session:
        record = session.run(query, id=poi_id).single()
        return record["deleted"] > 0


def get_stats() -> dict:
    with driver.session() as session:
        user_count = session.run("MATCH (u:User) RETURN count(u) AS n").single()["n"]
        saved_count = session.run(
            "MATCH (:User)-[:SAVED]->(sp:SavedPlace) RETURN count(sp) AS n"
        ).single()["n"]
        poi_count = session.run("MATCH (p:POI) RETURN count(p) AS n").single()["n"]

        reports_by_status = {
            r["status"]: r["n"]
            for r in session.run(
                "MATCH (r:Report) RETURN r.status AS status, count(r) AS n"
            )
        }
        reports_by_category = {
            r["category"]: r["n"]
            for r in session.run(
                "MATCH (r:Report) RETURN r.category AS category, count(r) AS n "
                "ORDER BY n DESC"
            )
        }
        pois_by_category = {
            r["categoryId"]: r["n"]
            for r in session.run(
                "MATCH (p:POI)-[:IN_CATEGORY]->(c:Category) "
                "RETURN c.id AS categoryId, count(p) AS n"
            )
        }

    return {
        "totalUsers": user_count,
        "totalSavedPlaces": saved_count,
        "totalPois": poi_count,
        "totalReports": sum(reports_by_status.values()),
        "reportsByStatus": reports_by_status,
        "reportsByCategory": reports_by_category,
        "poisByCategory": [
            {"layerId": layer.id, "layerLabel": layer.label, "count": pois_by_category.get(layer.id, 0)}
            for layer in LAYERS
        ],
    }
