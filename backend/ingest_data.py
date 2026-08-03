"""
Stage 07
Step 04

Purpose:
Run this once (or whenever the CSVs change) to (re)load all 18 layers'
data into Neo4j as POI/Category/LGA nodes. Idempotent — MERGE-based, safe
to re-run.

Usage: python3 ingest_data.py
"""

from app.services.graph_ingest import ingest_all

if __name__ == "__main__":
    counts = ingest_all()
    total = sum(counts.values())
    print(f"Ingested {total} POIs across {len(counts)} categories:")
    for layer_id, count in counts.items():
        print(f"  {layer_id}: {count}")
