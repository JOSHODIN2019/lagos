"""
Stage 02
Step 02

Purpose:
API route for the global place search bar.
"""

from fastapi import APIRouter, Query

from app.services.layers import search_all

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("")
def search(q: str = Query("", min_length=0)):
    return search_all(q)
