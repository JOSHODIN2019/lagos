"""
Stage 07
Step 03

Purpose:
Routes that only make sense once POI data is a real graph — currently just
"what's nearby," the first payoff of Stage 07's Neo4j migration.
"""

from fastapi import APIRouter, Query

from app.services.layers import nearby_pois

router = APIRouter(prefix="/api/nearby", tags=["graph"])


@router.get("")
def get_nearby(
    lon: float = Query(...),
    lat: float = Query(...),
    radius: float = Query(500, gt=0, le=5000),
    limit: int = Query(10, gt=0, le=50),
):
    return nearby_pois(lon, lat, radius_m=radius, limit=limit)
