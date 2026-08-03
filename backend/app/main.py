"""
Stage 01
Step 03

Purpose:
FastAPI application entrypoint for the Lagos map backend.
Serves layer metadata and GeoJSON endpoints consumed by the Next.js frontend.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.routers import admin, ai, auth, graph, layers, reports, saved_places, search
from app.services.db import ensure_constraints
from app.services.graph_ingest import ensure_poi_constraints

app = FastAPI(title="Lagos Map API", version="0.1.0")

# CORS_ORIGINS (explicit, exact origins) takes priority when set; otherwise
# fall back to the dev-only "any localhost port" regex. See config.py.
if CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=CORS_ORIGINS,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://localhost:\d+",
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["*"],
    )


@app.on_event("startup")
def on_startup():
    ensure_constraints()
    ensure_poi_constraints()


app.include_router(layers.router)
app.include_router(search.router)
app.include_router(auth.router)
app.include_router(saved_places.router)
app.include_router(reports.router)
app.include_router(graph.router)
app.include_router(ai.router)
app.include_router(admin.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
