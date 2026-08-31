"""
Data Preprocessing Script

Purpose:
Converts the 24 raw GeoJSON exports (Overpass/OSM queries, one per POI
category) into cleaned, flat CSV files — one CSV per category folder under
data/. This is the step that runs before any of it reaches the database:
raw nested GeoJSON Feature objects in, flat tabular rows out.

For each category folder in data/:
  1. Read the raw *.geojson export (a GeoJSON FeatureCollection).
  2. For each Feature, flatten it into a single row:
     - geom_type   the geometry's type (Point for every export in this
                    dataset — Overpass pre-computes a center point even
                    for way/relation features, per the "@geometry": "center"
                    property in the raw properties)
     - lon, lat    pulled out of geometry.coordinates
     - every key found in properties, as its own column
  3. Columns vary per category (a hospital has "healthcare:speciality",
     a bus stop doesn't) — the header is the union of every property key
     encountered, in first-seen order, so no data is silently dropped.
  4. Write <folder>/<folder>.csv, one row per feature.

Geographic filtering (removing the Lagos-Portugal contamination found in
this dataset) intentionally does NOT happen here — this script preserves
the raw export as a faithful CSV. Filtering happens downstream, at read
time, via LAGOS_NG_BOUNDS (see backend/app/services/layers.py and
graph_ingest.py) — keeping the raw-to-CSV step a lossless transcription
and the geographic cleaning step a separate, visible, re-runnable concern.

Usage: python3 scripts/preprocess_data.py
"""

import csv
import glob
import json
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def geojson_to_rows(geojson_path: str) -> tuple[list[str], list[dict]]:
    with open(geojson_path, encoding="utf-8") as fh:
        collection = json.load(fh)

    fieldnames = ["geom_type", "lon", "lat"]
    seen_fields = set(fieldnames)
    rows = []

    for feature in collection.get("features", []):
        geometry = feature.get("geometry") or {}
        coordinates = geometry.get("coordinates") or [None, None]
        properties = feature.get("properties") or {}

        row = {
            "geom_type": geometry.get("type", ""),
            "lon": coordinates[0],
            "lat": coordinates[1],
        }
        for key, value in properties.items():
            if key not in seen_fields:
                seen_fields.add(key)
                fieldnames.append(key)
            row[key] = value

        rows.append(row)

    return fieldnames, rows


def preprocess_category(folder_path: str) -> int:
    folder_name = os.path.basename(folder_path)
    geojson_matches = glob.glob(os.path.join(folder_path, "*.geojson"))
    if not geojson_matches:
        return 0

    fieldnames, rows = geojson_to_rows(geojson_matches[0])
    if not rows:
        return 0

    csv_path = os.path.join(folder_path, f"{folder_name}.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    return len(rows)


def preprocess_all() -> dict[str, int]:
    counts = {}
    for folder_path in sorted(glob.glob(os.path.join(DATA_DIR, "*"))):
        if os.path.isdir(folder_path):
            counts[os.path.basename(folder_path)] = preprocess_category(folder_path)
    return counts


if __name__ == "__main__":
    counts = preprocess_all()
    total = sum(counts.values())
    print(f"Preprocessed {total} raw POI records across {len(counts)} categories:")
    for folder_name, count in counts.items():
        print(f"  {folder_name}: {count}")
