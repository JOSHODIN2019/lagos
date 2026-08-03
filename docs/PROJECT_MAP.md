# Project Map

```
lagos/
├── README.md                  Setup/run instructions, tech stack, stage summary
├── SECURITY.md                Security posture: what's implemented, what isn't, secrets setup
├── CLAUDE.md                  Verification-loop + architecture standing instructions
├── PROJECT_MEMORY.md          Source of truth: mission, rules, stage roadmap, stage log
├── .gitignore
├── data/                      24 curated OSM layers, one folder each: <name>.geojson + <name>.csv
│   ├── hospitals/ schools/ banks/ ... (18 wired into the graph — see docs/API.md)
│   └── schools_b/ universities_b/ roads/ roads_b/ government_offices_b/ empty_dataset/
│                              (raw duplicates / unused — not ingested as categories)
│                              Since Stage 7 these CSVs are the ETL *source*, not read live —
│                              see `backend/ingest_data.py`.
├── backend/                   FastAPI app
│   ├── requirements.txt
│   ├── .env.example            Documents every env var; copy to .env (gitignored) for real values
│   ├── ingest_data.py          Stage 7 ETL: (re)loads data/*.csv into Neo4j (idempotent)
│   └── app/
│       ├── main.py             App entrypoint, CORS (env-overridable), startup constraints, health
│       ├── config.py           Env-driven settings: Neo4j, JWT, Ollama, ADMIN_EMAILS, CORS_ORIGINS
│       ├── deps.py             get_current_user / get_current_admin — JWT auth dependencies
│       ├── routers/
│       │   ├── layers.py       GET /api/layers, /api/layers/{id}/geojson
│       │   ├── search.py       GET /api/search
│       │   ├── auth.py         /api/auth/signup, /login, /me
│       │   ├── saved_places.py /api/saved (GET/POST/DELETE)
│       │   ├── reports.py      /api/reports (categories, mine, POST)
│       │   ├── graph.py        GET /api/nearby (Stage 7 spatial query)
│       │   ├── ai.py           POST /api/ai/ask (Stage 8 AI Query Interpreter)
│       │   └── admin.py        /api/admin/* — stats, report moderation, POI management
│       └── services/
│           ├── layers.py       Layer registry, Neo4j→GeoJSON, search (all graph-backed since Stage 7)
│           ├── graph_ingest.py Stage 7 ETL logic: CSV→POI/Category/LGA nodes, LGA heuristic
│           ├── db.py           Neo4j driver singleton + startup constraints
│           ├── auth.py         bcrypt password hashing, JWT create/verify
│           ├── users.py        Neo4j-backed user CRUD
│           ├── saved_places.py Neo4j-backed saved places (per-user MERGE idempotency)
│           ├── reports.py      Neo4j-backed citizen reports + SHA-256 proof hash
│           ├── ai_query.py     NL→Cypher via local Ollama, safety validation, answer formatting
│           ├── admin.py        Admin-only POI CRUD + usage stats aggregation
│           └── audit.py        Stage 11: log_event() — auth/admin action audit logging
├── frontend/                   Next.js app
│   ├── .env.local              NEXT_PUBLIC_API_BASE_URL
│   └── src/                    see docs/COMPONENTS.md for the full breakdown
│       └── app/admin/page.tsx  The one route outside the map — admin dashboard
└── docs/
    ├── ARCHITECTURE.md         System design, data flow, per-stage design decisions
    ├── API.md                  Endpoint reference
    ├── COMPONENTS.md           Frontend component tree + reuse notes
    └── PROJECT_MAP.md          This file
```

## Where things live, by concern

| Concern | Location |
|---|---|
| Stage roadmap / current stage | `PROJECT_MEMORY.md` §18 |
| Data quality issues (Portugal contamination, LGA heuristic) | `docs/ARCHITECTURE.md` |
| Adding a new map layer/category | Register it in `backend/app/services/layers.py` `LAYERS`, re-run `ingest_data.py` |
| Adding a new frontend screen | New folder under `frontend/src/components/` (map overlay) or `frontend/src/app/` (separate route, like `/admin`) |
| Backend business logic | `backend/app/services/` |
| API routes | `backend/app/routers/` |
| Protecting a route (any signed-in user) | `Depends(get_current_user)` from `backend/app/deps.py` |
| Protecting a route (admin only) | `Depends(get_current_admin)` from `backend/app/deps.py` |
| Gating a frontend action on login | `useAuth()` from `frontend/src/components/auth/AuthProvider.tsx` |
| Neo4j / JWT / Ollama / admin / CORS settings | `backend/app/config.py` (env vars — see `.env.example`) |
| Audit logging a new event | `log_event()` from `backend/app/services/audit.py` |
| Right-side panel system (Detail/Saved/Reports/AIChat) | `MapScreen.tsx`'s if/else-if chain — see `docs/COMPONENTS.md` |
