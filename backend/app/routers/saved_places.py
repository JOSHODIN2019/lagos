"""
Stage 05
Step 02

Purpose:
Protected routes for a signed-in user's saved places. Every route depends
on get_current_user, matching the pattern set in Stage 04 for future
protected features (reports, admin, etc).
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, field_validator

from app.deps import get_current_user
from app.services.saved_places import delete_saved_place, list_saved_places, save_place

router = APIRouter(prefix="/api/saved", tags=["saved-places"])


class SavePlaceRequest(BaseModel):
    layerId: str = Field(max_length=100)
    layerLabel: str = Field(max_length=100)
    color: str = Field(max_length=20)
    name: str = Field(max_length=300)
    lon: float
    lat: float
    properties: dict[str, str] = {}

    @field_validator("properties")
    @classmethod
    def limit_properties_size(cls, v: dict[str, str]) -> dict[str, str]:
        # Stage 11: this dict is just carried through to storage — bound it
        # so a direct API call (bypassing the UI, which only ever sends a
        # real POI's OSM tags) can't stuff an arbitrarily large blob in.
        if len(v) > 50:
            raise ValueError("Too many properties")
        for key, value in v.items():
            if len(key) > 100 or len(value) > 1000:
                raise ValueError("Property key/value too long")
        return v


@router.get("")
def list_saved(current_user: dict = Depends(get_current_user)):
    return list_saved_places(current_user["id"])


@router.post("")
def save(
    body: SavePlaceRequest,
    current_user: dict = Depends(get_current_user),
):
    return save_place(
        user_id=current_user["id"],
        layer_id=body.layerId,
        layer_label=body.layerLabel,
        color=body.color,
        name=body.name,
        lon=body.lon,
        lat=body.lat,
        properties=body.properties,
    )


@router.delete("/{saved_place_id}")
def delete_saved(
    saved_place_id: str,
    current_user: dict = Depends(get_current_user),
):
    deleted = delete_saved_place(current_user["id"], saved_place_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Saved place not found"
        )
    return {"status": "deleted"}
