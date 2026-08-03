"""
Stage 09
Step 03

Purpose:
Admin-only routes — every route here depends on get_current_admin, not just
get_current_user. Covers report moderation, POI management, and stats.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.deps import get_current_admin
from app.services.admin import delete_poi, get_stats, list_pois, update_poi_name
from app.services.audit import log_event
from app.services.reports import (
    REPORT_STATUSES,
    list_all_reports,
    update_report_status,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/stats")
def stats(_admin: dict = Depends(get_current_admin)):
    return get_stats()


@router.get("/reports")
def get_all_reports(_admin: dict = Depends(get_current_admin)):
    return list_all_reports()


class UpdateReportStatusRequest(BaseModel):
    status: str


@router.patch("/reports/{report_id}")
def patch_report_status(
    report_id: str,
    body: UpdateReportStatusRequest,
    admin: dict = Depends(get_current_admin),
):
    if body.status not in REPORT_STATUSES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"status must be one of {REPORT_STATUSES}",
        )
    report = update_report_status(report_id, body.status)
    if report is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")
    log_event(
        "admin.report_status_change",
        admin_email=admin["email"],
        report_id=report_id,
        new_status=body.status,
    )
    return report


@router.get("/pois")
def get_pois(
    category: str | None = Query(None),
    q: str | None = Query(None),
    limit: int = Query(50, gt=0, le=200),
    offset: int = Query(0, ge=0),
    _admin: dict = Depends(get_current_admin),
):
    return list_pois(category_id=category, q=q, limit=limit, offset=offset)


class UpdatePoiRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)


@router.patch("/pois/{poi_id}")
def patch_poi(
    poi_id: str,
    body: UpdatePoiRequest,
    admin: dict = Depends(get_current_admin),
):
    poi = update_poi_name(poi_id, body.name.strip())
    if poi is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    log_event(
        "admin.poi_update",
        admin_email=admin["email"],
        poi_id=poi_id,
        new_name=body.name.strip(),
    )
    return poi


@router.delete("/pois/{poi_id}")
def remove_poi(poi_id: str, admin: dict = Depends(get_current_admin)):
    deleted = delete_poi(poi_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="POI not found")
    log_event("admin.poi_delete", admin_email=admin["email"], poi_id=poi_id)
    return {"status": "deleted"}
