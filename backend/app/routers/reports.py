"""
Stage 06
Step 02

Purpose:
Protected routes for citizen issue reports.
"""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.deps import get_current_user
from app.services.reports import REPORT_CATEGORIES, create_report, list_my_reports

router = APIRouter(prefix="/api/reports", tags=["reports"])


class CreateReportRequest(BaseModel):
    category: str
    description: str = Field(min_length=1, max_length=1000)
    lon: float
    lat: float


@router.get("/categories")
def get_categories():
    return REPORT_CATEGORIES


@router.get("/mine")
def list_mine(current_user: dict = Depends(get_current_user)):
    return list_my_reports(current_user["id"])


@router.post("")
def submit_report(
    body: CreateReportRequest,
    current_user: dict = Depends(get_current_user),
):
    category = body.category if body.category in REPORT_CATEGORIES else "Other"
    return create_report(
        user_id=current_user["id"],
        category=category,
        description=body.description,
        lon=body.lon,
        lat=body.lat,
    )
