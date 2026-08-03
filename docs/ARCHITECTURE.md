# Architecture

## Overview

Lagos Explorer is a civic/POI map platform for Lagos, Nigeria. A Next.js
frontend renders a Leaflet map and a layer-toggle sidebar; a FastAPI backend
serves each data layer as GeoJSON. As of Stage 7, the backend's source of
truth is Neo4j (POI/Category/LGA graph), not the CSVs directly — the CSVs
in `data/` are now the ETL input, ingested once via `graph_ingest.py`.

```
┌─────────────────────┐   HTTP (GET, JSON)   ┌──────────────────────┐   Bolt   ┌───────────┐
│   Next.js frontend   │ ────────────────────▶│   FastAPI backend    │─────────▶│   Neo4j   │
│   (localhost:3000+)  │◀──────────────────── │   (localhost:8010)   │◀─────────│  (graph)  │
└─────────────────────┘                       └──────────────────────┘          └───────────┘
        │                                                                              ▲
        │ Leaflet + react-leaflet + leaflet.markercluster                             │ one-time ETL
        ▼                                                                              │
   Browser map UI                                                          data/<layer>/<layer>.csv
                                                                             (18 curated OSM layers)
```

## Frontend (`frontend/`)

- **Next.js 16, App Router, TypeScript, Tailwind CSS v4.**
- Entry route (`src/app/page.tsx`) launches directly into `MapScreen` — no
  landing page, per the UI standards in `PROJECT_MEMORY.md`.
- `MapScreen` owns all screen state: layer metadata, which layers are
  toggled visible, and a GeoJSON cache keyed by layer id. Each layer's
  data is fetched lazily, the first time it's toggled on.
- `MapView` is dynamically imported with `ssr: false` since Leaflet touches
  `window`/DOM APIs that don't exist during server rendering.
- `ClusterLayer` drives `leaflet.markercluster` imperatively via the
  `useMap()` escape hatch — react-leaflet has no first-party clustering
  support, so this is the standard pattern for wrapping non-React Leaflet
  plugins.
- Theme (light/dark) is a small React context (`ThemeProvider`) that toggles
  a `dark` class on `<html>` and persists the choice to `localStorage`;
  Tailwind v4's `@custom-variant dark` picks that class up.

## Backend (`backend/`)

- **FastAPI**, single router (`app/routers/layers.py`) exposing:
  - `GET /api/layers` — metadata for all 18 layers (id, label, category,
    color, icon, default visibility, live feature count).
  - `GET /api/layers/{id}/geojson` — that layer's features as a GeoJSON
    `FeatureCollection`.
- `app/services/layers.py` holds the layer registry and (as of Stage 7)
  queries Neo4j for POI data, converting nodes back into GeoJSON. The
  **Lagos, Nigeria bounding-box filter** (`LAGOS_NG_BOUNDS`) is now applied
  once at ingestion time rather than on every request — see "Data quality"
  below and the Stage 7 section.
- CORS is currently `allow_origin_regex=r"http://localhost:\d+"` (dev-only,
  any localhost port) since the frontend's dev port isn't fixed. This must
  be tightened to a specific origin before Stage 11 (Security hardening).

## Authentication (Stage 4)

- **Neo4j Community Edition** (installed via Homebrew — `brew services start
  neo4j`) is now running and holds the first real graph data: `(:User)`
  nodes with a unique constraint on `email`. `app/services/db.py` holds the
  driver singleton and the startup constraint check; connection settings
  live in `app/config.py` (`NEO4J_URI`/`NEO4J_USER`/`NEO4J_PASSWORD` env vars,
  dev defaults otherwise).
- Passwords are hashed with **bcrypt directly** (`app/services/auth.py`) —
  not via `passlib`, whose bcrypt backend-detection shim throws on modern
  bcrypt releases (a known, unfixed upstream incompatibility). JWTs are
  signed HS256 via `PyJWT`, 7-day expiry, secret from `JWT_SECRET` env var.
- `app/deps.py` — `get_current_user` is the reusable dependency for
  protecting any future route: `Depends(get_current_user)` resolves the
  Bearer JWT to a live Neo4j user record or raises 401.
- Frontend: `AuthProvider` (context) persists the JWT in `localStorage` and
  restores the session on load via `GET /api/auth/me`. `AuthModal` is a
  tabbed sign in/up form; `AccountButton` is the sidebar header affordance.
  No dedicated auth page — the modal overlays the map, per the "no landing
  page" rule.

## Saved Places (Stage 5)

- First protected feature built on Stage 4's auth. Graph shape:
  `(:User)-[:SAVED]->(:SavedPlace)`, one `SavedPlace` node per user per
  place — the same real-world place saved by two users creates two separate
  nodes, so there's no premature sharing/dedup across users before Stage 07's
  POI graph exists. `app/services/saved_places.py` MERGEs on a `key`
  (`layerId:lon:lat`) scoped through the user's own `SAVED` relationship, so
  re-saving the same place is idempotent per-user without a global DB
  constraint.
- `GET/POST /api/saved`, `DELETE /api/saved/{id}` — all three routes depend
  on `get_current_user`.
- Frontend: `DetailPanel`'s bookmark button is an ARIA toggle button
  (`aria-pressed`), gated in `MapScreen.handleToggleSave` — if `user` is
  null it opens `AuthModal` instead of calling the API. `SavedPlacesPanel`
  reuses the same right-side slot as `DetailPanel` (mutually exclusive,
  toggled via `savedPanelOpen` in `MapScreen`).

## Citizen Reporting (Stage 6)

- Graph shape: `(:User)-[:REPORTED]->(:Report {id, category, description,
  lon, lat, status, createdAt, proofHash})`. `status` starts as
  `"submitted"`; Stage 9's admin dashboard is what will change it.
- **Proof of submission** (`app/services/reports.py`): a real SHA-256 digest
  of the report's own content (id + category + description + coordinates +
  timestamp) — a genuine, independently-verifiable hash, not a fabricated
  one. Per Section 9 of PROJECT_MEMORY.md, the UI presents this as a
  simulated tamper-evident record and explicitly does not claim blockchain
  storage, since none is implemented.
- `GET /api/reports/categories` (public, feeds the form's dropdown),
  `GET /api/reports/mine` + `POST /api/reports` (both protected).
- Frontend flow: `ReportFAB` arms report mode (gated — opens `AuthModal` if
  signed out) → `ReportClickCapture` (a `useMapEvents({click})` component,
  only mounted while armed) captures the next map click as the report
  location → `ReportForm` (category select + description) → submits →
  shows the proof-of-submission receipt in place. `MyReportsPanel` lists
  past reports and shares the same right-side slot as the other panels.

## Knowledge Graph Ingestion (Stage 7)

- **The API contract is unchanged.** `GET /api/layers`, `GET
  /api/layers/{id}/geojson`, and `GET /api/search` return exactly the same
  shapes as before — only what's behind them changed, from reading
  `data/*.csv` at request time to querying Neo4j. The frontend needed zero
  code changes for this migration.
- Graph shape: `(:POI {id, name, lon, lat, properties})`, one node per
  feature, linked `(:POI)-[:IN_CATEGORY]->(:Category {id, label, color,
  icon})` (one Category per layer) and `(:POI)-[:LOCATED_IN]->(:LGA
  {name})`. `properties` is the OSM tag dict JSON-stringified (same
  approach as `SavedPlace.properties` in Stage 5), since Neo4j node
  properties can't hold nested maps.
- **ETL**: `backend/app/services/graph_ingest.py` reads the same 18 CSVs
  Stage 1 always used, applies the same `LAGOS_NG_BOUNDS` filter, and
  MERGEs everything into the graph — idempotent, safe to re-run via
  `python3 backend/ingest_data.py`. `POI.id` is a deterministic UUID5 from
  `layerId + lon + lat + name`, so re-ingestion updates existing nodes
  rather than duplicating them.
- **LGA assignment is a nearest-centroid heuristic, not a true boundary
  lookup** — the dataset has no LGA polygon shapes anywhere, only OSM
  points, so `nearest_lga()` picks the closest of 20 approximate LGA center
  points (`LGA_CENTROIDS` in `graph_ingest.py`) by straight-line distance.
  This is a deliberate, documented approximation for a demo app, not
  presented as authoritative — it will occasionally misassign a POI near an
  LGA border.
- **NEAR is a query-time capability, not precomputed edges.**
  `GET /api/nearby?lon=&lat=&radius=` (new in this stage) uses Neo4j's
  native `point.distance()` at query time. Materializing a `NEAR`
  relationship for every pair of the ~3,120 POIs within some radius would
  be a large, mostly-useless edge explosion that goes stale the moment the
  radius changes; a live spatial query scales better and is the idiomatic
  Neo4j approach. This is what Stage 8's AI Query Interpreter will build on
  for "what's near X" questions.

## AI Query Interpreter (Stage 8)

The flow from the original product diagram: **User → Web App → AI Query
Interpreter → Cypher query → Neo4j Knowledge Graph → Answer.**

- **Local, free LLM — no paid API calls anywhere in this flow.** Ollama
  (`brew install ollama`, `brew services start ollama`) runs
  `llama3.2:3b` entirely offline. Per Section 5's "free technologies only"
  rule, this is the real thing (genuine NL→Cypher generation), not a
  simulation — the simulation clause only applies where a paid service
  would otherwise be required, and it isn't here.
- **Model choice was a real tradeoff, not the first pick.** `qwen2.5:7b`
  (a stronger model) was attempted first but its ~4.7GB download failed
  three times with the same DNS error against Ollama's registry — a
  networking issue in this environment, not a model problem. Rather than
  keep fighting a flaky download, `llama3.2:3b` (already downloaded, 2GB)
  was made reliable enough through prompt engineering instead: reordering
  few-shot examples (simple "total count" examples first, since a 3B model
  weights early/late examples more than middle ones), one explicit
  distinguishing rule ("total" vs "per-LGA breakdown" questions), and a
  one-retry-on-failure loop in `ask_question()`. This took it from
  frequently wrong to correct on every question in the verification set.
- **Security-by-design, not just prompt instructions.** The schema shown
  to the model — and everything it's allowed to query — is restricted to
  `POI`/`Category`/`LGA` only. User accounts, saved places, and citizen
  reports are never mentioned in the prompt. Three independent layers of
  defense, verified live (asking it to "delete all hospitals" produced a
  real `DELETE p` Cypher statement from the model — confirming this isn't
  theoretical):
  1. Keyword filter (`app/services/ai_query.py`) rejects any generated
     query containing `CREATE`/`MERGE`/`SET`/`DELETE`/`REMOVE`/`DROP`/`CALL`.
  2. Label filter rejects any query referencing a node label outside
     `{POI, Category, LGA}` (a regex bug here — matching relationship
     types like `[:IN_CATEGORY]` as if they were node labels — was caught
     and fixed during this stage's own testing).
  3. Neo4j's own read-transaction mode (`session.execute_read`) rejects
     write operations server-side even if both application-level checks
     were somehow bypassed.
- **No second LLM call for the answer.** Query results are formatted into
  the plain-language answer with plain Python (`_format_answer()`), not a
  second model round-trip — matching the diagram's "Cypher query → Answer"
  (results formatted, not re-interpreted), and avoiding compounding a
  second unreliable generation on top of the first.
- `POST /api/ai/ask` is public, like search — it only ever touches the
  public POI graph, so there's no reason to gate it behind auth.
- Frontend: `AIChatPanel` (chat bubbles, a per-answer "View query" toggle
  showing the generated Cypher for transparency) shares the same
  mutually-exclusive right-side slot as the other panels. `AIResultMarkers`
  highlights returned POIs on the map in a distinct color and flies the
  view to fit them — asking a question visibly does something on the map,
  not just in the chat log.
- **Known limitation, honestly scoped rather than hidden:** the
  interpreter handles count/list/breakdown-by-LGA questions well (what its
  few-shot examples cover), but a "closest hospital to X" style question —
  which requires first resolving "X" to coordinates, then a distance
  query — isn't covered by the current examples and falls back to a
  generic list query instead of true proximity search. `nearby_pois()`
  from Stage 7 exists and works (verified via curl); teaching the
  interpreter to chain through it is future work, not silently claimed as
  done.

## Admin Dashboard (Stage 9)

- **Access control is an email allowlist (`ADMIN_EMAILS` env var), not a
  stored/mutable database flag.** There's no admin-management UI in this
  project, so a mutable `is_admin` column on `User` would be a
  privilege-escalation surface with no way to audit who set it. An
  env-configured allowlist, checked at request time in `get_current_admin`
  (`app/deps.py`, layered on top of `get_current_user`), is simpler and
  safer for this project's scope.
- **A real conflict with Stage 7's ingestion had to be resolved.** The
  Stage 7 ETL originally used `SET` unconditionally on every re-run,
  meaning re-ingesting the CSVs would silently overwrite any admin edit to
  a POI's name. Fixed by changing it to `ON CREATE SET` — first ingestion
  is authoritative, later re-runs only add new POIs, never overwrite
  existing (possibly admin-edited) ones. Verified live: edited a POI name,
  re-ran `ingest_data.py`, confirmed the edit survived.
- Routes: `GET /api/admin/stats`, `GET/PATCH /api/admin/reports`,
  `GET/PATCH/DELETE /api/admin/pois` — all behind `get_current_admin`,
  verified to return 403 for an authenticated non-admin user.
- Frontend: `/admin` is a genuinely separate route (`app/admin/page.tsx`),
  not a map overlay — unlike every other screen so far, this is a distinct
  utility surface for staff, so it gets its own page rather than joining
  the right-side panel chain. `AdminDashboard` gates in three states (not
  logged in → logged in but not admin → admin), each rendered by the
  component itself rather than a route middleware, since Next.js
  middleware can't see localStorage-held JWTs without extra plumbing this
  scope doesn't need. The "Admin dashboard" link in `AccountButton` only
  renders when `user.isAdmin` is true.

## Responsive & Accessibility Polish (Stage 10)

A cross-cutting pass over every screen from Stages 1-9, not a new feature.

- **Mobile sidebar is a slide-in drawer, not a permanently-docked column.**
  Below Tailwind's `md` breakpoint there simply isn't room for a 320px
  sidebar alongside the map. `Sidebar` is `fixed` + `-translate-x-full`
  (hidden) by default, `md:static md:translate-x-0` restores the original
  desktop layout exactly — verified live at both 390px and 1440px widths,
  desktop pixel-identical to pre-Stage-10. A hamburger button
  (`MapScreen`, `md:hidden`) opens it; a `bg-black/40` backdrop (also
  `md:hidden`) closes it on tap. The right-side panels (`DetailPanel`,
  `SavedPlacesPanel`, etc.) needed **no changes** — they were already
  `w-full max-w-sm`, which is full-width on any viewport narrower than
  384px.
- **`SearchBar` repositioned on mobile** (`left-16` instead of centered) so
  it doesn't sit under the new hamburger button; unchanged at `md:` and up.
- **Keyboard**: Escape closes whatever's topmost, centralized in one
  `MapScreen` effect that mirrors the existing panel-priority chain
  (auth modal → AI chat → report flow → my-reports → saved-places →
  detail panel → mobile sidebar) rather than duplicating the key handler
  per component.
- **`AuthModal` is a real dialog now**: `role="dialog"` + `aria-modal` +
  `aria-labelledby`, initial focus into the email field on open, a Tab/
  Shift+Tab focus trap so keyboard focus can't escape to the page behind
  the backdrop, and click-the-backdrop-to-close.
- **Landmarks**: `Sidebar` is `role="navigation" aria-label="Map layers"`;
  each right-side panel (`<aside>`) got a distinct `aria-label` so a
  screen reader user can tell them apart when more than one could
  theoretically be in the DOM. `AdminDashboard` already used semantic
  `<header>`/`<nav>`/`<main>` from Stage 9.
- **Color contrast**: `text-zinc-400` on white/light backgrounds is
  roughly 2.8:1 — well under WCAG AA's 4.5:1 for normal text — and it had
  spread across nearly every secondary-text label in the app (counts,
  timestamps, section headers, empty-state messages, icon buttons).
  Mechanically bumped every light-mode instance to `text-zinc-500`
  (~4.6:1, passes AA) while leaving dark-mode variants and placeholder
  text untouched. **Caught and fixed one bug this introduced**: the
  substitution script created `dark:text-zinc-400 dark:text-zinc-500`
  (a duplicate/conflicting class pair) in one file that already had its
  own dark-mode override — checked for this pattern across the whole
  change afterward, found and fixed the one occurrence.
- **Admin dashboard responsiveness** (Stage 9 shipped without this,
  documented as a known gap at the time): `AdminReports`/`AdminPois`
  tables now sit in an `overflow-x-auto` wrapper with a `min-width` so
  they scroll horizontally instead of crushing illegibly on narrow
  screens; header/tab-bar padding and gaps scale down below `sm`.
- **Not done, and not claimed as done**: a full screen-reader pass (only
  tested via DOM semantics and axe-style manual reasoning, not an actual
  VoiceOver run), and further animation polish beyond what Stages 1-9
  already had (panel slide transitions, theme toggle) — this stage's
  time went to the higher-impact structural mobile/keyboard/contrast work
  instead.

## Data quality: Lagos, Portugal contamination

The source OSM exports were nominally for Lagos, Nigeria, but a meaningful
number of records were actually from Lagos, Portugal (Algarve) — e.g. bus
stops dropped from 466 → 136 real Nigeria records once filtered, heritage
sites from 24 → 3. `LAGOS_NG_BOUNDS` (`lon 2.5–4.5`, `lat 6.0–6.8`) drops
anything outside Lagos State. As of Stage 7 this filter runs once in
`graph_ingest.py` at ingestion time rather than on every request; the raw
CSVs are untouched, so re-ingesting after a filter change is just a re-run.

## Planned evolution (later stages)

Stage 11 (Security, Testing & Deployment Prep) is last — a security review
against Section 8's checklist (the CORS `allow_origin_regex` and the
dev-only secrets in `config.py` both need tightening before anything
resembling production), a full functional test pass, and `git init` +
push. See `PROJECT_MEMORY.md` §18 for the full 11-stage roadmap.
