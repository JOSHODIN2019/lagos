# API Reference

Base URL (dev): `http://localhost:8010`

## `GET /api/health`

Liveness check.

```json
{ "status": "ok" }
```

## `GET /api/layers`

Metadata for all 18 map layers, in fixed registry order.

```json
[
  {
    "id": "hospitals",
    "label": "Hospitals",
    "category": "Health",
    "color": "#dc2626",
    "icon": "hospital",
    "defaultVisible": true,
    "count": 518
  },
  ...
]
```

`count` is the live number of POIs in that Category node in Neo4j (Stage 7)
— the Lagos-Nigeria bounding-box filter is applied once at ingestion time,
not per-request, so this reflects what the frontend will actually render.

## `GET /api/layers/{id}/geojson`

That layer's data as a standard GeoJSON `FeatureCollection` of `Point`
features. `404` if `id` isn't a known layer (see the registry in
`backend/app/services/layers.py`).

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [3.4271419, 6.4422291] },
      "properties": { "name": "LASWA", "office": "government", "...": "..." }
    }
  ]
}
```

`properties` is the full set of non-empty OSM tags for that feature — the
same shape as before Stage 7, just sourced from the POI node's
JSON-stringified `properties` field instead of a CSV row.

## `GET /api/search?q=`

Global place search across all 18 layers, matching `name` (case-insensitive
substring, prefix matches ranked first). Returns up to 30 hits.

```json
[
  {
    "name": "UNILAG Medical Centre",
    "layerId": "clinics",
    "layerLabel": "Clinics",
    "color": "#f97316",
    "lon": 3.3979,
    "lat": 6.5158,
    "properties": { "amenity": "clinic", "healthcare": "clinic", "...": "..." }
  }
]
```

## Layer ids

`bus_stops`, `bus_stations`, `railway_stations`, `ferry_terminals`,
`bridges`, `hospitals`, `clinics`, `schools`, `universities`, `colleges`,
`police_stations`, `fire_stations`, `government_offices`, `banks`,
`heritage_sites`, `museums`, `hotels`, `trail_waypoints_and_attractions`.

(`schools_b`, `universities_b`, `roads`, `roads_b`, `government_offices_b`,
`empty_dataset` exist as raw data under `data/` but are not registered as
API layers — see the "duplicate folders" open question in
`PROJECT_MEMORY.md` §17.)

## Auth (Stage 4)

### `POST /api/auth/signup`

```json
// request
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "at least 8 chars" }
// response (also sets nothing — token is returned, not cookied)
{ "token": "<jwt>", "user": { "id": "...", "email": "...", "name": "...", "createdAt": "..." } }
```

`409` if the email is already registered. `422` if validation fails
(bad email format, password under 8 characters).

### `POST /api/auth/login`

```json
{ "email": "ada@example.com", "password": "..." }
```

Same `AuthResponse` shape as signup. `401` on wrong email/password.

### `GET /api/auth/me`

Protected — requires `Authorization: Bearer <token>`. Returns the current
user record, or `401` if the token is missing, invalid, expired, or the
user no longer exists. This is the pattern every protected route (saved
places, reporting, admin) follows via `Depends(get_current_user)` in
`app/deps.py`.

## Saved Places (Stage 5)

All three routes are protected (`Authorization: Bearer <token>` required).

### `GET /api/saved`

List the current user's saved places, newest first.

### `POST /api/saved`

```json
{ "layerId": "banks", "layerLabel": "Banks", "color": "#0f766e", "name": "Ecobank", "lon": 3.43, "lat": 6.45, "properties": {} }
```

Idempotent per user — saving the same `layerId`+coordinates again returns
the existing saved place rather than creating a duplicate. Returns the
saved place with its `id` and `savedAt`.

### `DELETE /api/saved/{id}`

`404` if that saved place doesn't exist (or isn't the current user's).

## Citizen Reporting (Stage 6)

### `GET /api/reports/categories`

Public. The fixed list of report categories (`Pothole / bad road`, `Broken
streetlight`, `Flooding / drainage`, `Waste & sanitation`, `Damaged public
infrastructure`, `Other`).

### `GET /api/reports/mine`

Protected. The current user's submitted reports, newest first.

### `POST /api/reports`

Protected.

```json
{ "category": "Pothole / bad road", "description": "...", "lon": 3.35, "lat": 6.60 }
```

Returns the created report, including `proofHash` (a real SHA-256 digest of
the report's own content) and `proofMessage` (the Section-9 simulated
tamper-evidence disclaimer — see `docs/ARCHITECTURE.md`).

## Graph queries (Stage 7)

### `GET /api/nearby?lon=&lat=&radius=&limit=`

Public. Any POI, across all categories, within `radius` meters (default
500, max 5000) of the given point, nearest first, capped at `limit`
(default 10, max 50). Each result includes `distanceMeters`. Computed at
query time via Neo4j's `point.distance()` — see `docs/ARCHITECTURE.md` for
why this isn't precomputed `NEAR` edges.

```json
[
  { "name": "Bajulaye Police Post", "layerId": "police_stations", "layerLabel": "Police Stations",
    "color": "#1e40af", "lon": 3.3763331, "lat": 6.5270258, "properties": {}, "distanceMeters": 431.3 }
]
```

## AI Query Interpreter (Stage 8)

### `POST /api/ai/ask`

Public — same reasoning as search: only ever touches the public POI graph.
Requires Ollama running locally (`brew services start ollama`,
`llama3.2:3b` pulled).

```json
// request
{ "question": "How many hospitals are there?" }
// response
{
  "question": "How many hospitals are there?",
  "cypher": "MATCH (p:POI)-[:IN_CATEGORY]->(:Category {id: \"hospitals\"}) RETURN count(p) AS count",
  "answer": "That's 518.",
  "resultCount": 1,
  "mapPoints": []
}
```

`cypher` is `null` and `answer` explains what went wrong when: the question
is empty, the model's generated query fails safety validation (write
keyword or disallowed label — see `docs/ARCHITECTURE.md`), or Ollama isn't
reachable. `mapPoints` is populated (`{name, lon, lat}[]`) whenever the
query returned individual POIs, so the frontend can highlight them on the
map — empty for aggregate/count-only answers.

Handles count, list-by-category, list-by-category-and-LGA, and
breakdown-by-LGA questions reliably. Does not yet handle "nearest to X"
style questions (see the known-limitation note in `docs/ARCHITECTURE.md`).

## Admin (Stage 9)

All routes below require `Authorization: Bearer <token>` **and** that the
token's email is in the `ADMIN_EMAILS` allowlist (see
`docs/ARCHITECTURE.md`) — `403` otherwise, even for a signed-in non-admin
user.

### `GET /api/admin/stats`

```json
{
  "totalUsers": 2, "totalSavedPlaces": 0, "totalPois": 3120, "totalReports": 1,
  "reportsByStatus": { "resolved": 1 },
  "reportsByCategory": { "Pothole / bad road": 1 },
  "poisByCategory": [ { "layerId": "hospitals", "layerLabel": "Hospitals", "count": 518 } ]
}
```

### `GET /api/admin/reports`

Every report across every user, newest first, each with `reporterName`/
`reporterEmail` added on top of the shape from `GET /api/reports/mine`.

### `PATCH /api/admin/reports/{id}`

```json
{ "status": "resolved" }
```

`status` must be one of `submitted | in_review | resolved | rejected`
(`422` otherwise). Returns the updated report (same shape as the list).

### `GET /api/admin/pois?category=&q=&limit=&offset=`

Paginated, optionally filtered by category id and/or a case-insensitive
name substring (`limit` default 50 max 200, `offset` default 0).

```json
{ "items": [ { "id": "...", "name": "...", "lon": 3.35, "lat": 6.60, "layerId": "schools", "layerLabel": "Schools", "color": "#16a34a" } ], "total": 420 }
```

### `PATCH /api/admin/pois/{id}`

```json
{ "name": "Corrected Name" }
```

Renames a POI. This edit is permanent across re-ingestion — see the
`ON CREATE SET` note in `docs/ARCHITECTURE.md`.

### `DELETE /api/admin/pois/{id}`

`404` if the POI doesn't exist. Note: deleting a POI and then re-running
`ingest_data.py` will re-create it from the CSV (deletion isn't "sticky"
the way an edit is, since there's nothing to `ON CREATE SET` around for a
node that no longer exists).
