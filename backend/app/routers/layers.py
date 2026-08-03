"""
Stage 01
Step 02

Purpose:
API routes for listing available map layers and fetching each
layer's data as GeoJSON for the Leaflet frontend.
"""

from fastapi import APIRouter, HTTPException

from app.services.layers import LAYERS, get_layer, layer_feature_count, read_layer_geojson

router = APIRouter(prefix="/api/layers", tags=["layers"])


@router.get("")
def list_layers():
    return [
        {
            "id": layer.id,
            "label": layer.label,
            "category": layer.category,
            "color": layer.color,
            "icon": layer.icon,
            "defaultVisible": layer.default_visible,
            "count": layer_feature_count(layer),
        }
        for layer in LAYERS
    ]


@router.get("/{layer_id}/geojson")
def get_layer_geojson(layer_id: str):
    layer = get_layer(layer_id)
    if layer is None:
        raise HTTPException(status_code=404, detail=f"Unknown layer '{layer_id}'")
    return read_layer_geojson(layer)
