# Lagos Explorer

**Live:** [lagos-explorer.vercel.app](https://lagos-explorer.vercel.app) (frontend, Vercel) ·
[lagos-explorer-api.onrender.com](https://lagos-explorer-api.onrender.com) (backend, Render) —
both on free tiers. The AI query interpreter runs on Groq's free-tier API in this deployment
instead of local Ollama (see Stage 12 in `PROJECT_MEMORY.md` and `LLM_PROVIDER` below).

An interactive civic/points-of-interest map platform for Lagos, Nigeria —
browse hospitals, schools, transport, banks, and more on a live map;
search; save places; report civic issues; ask questions in plain English
and get answers pulled from a real knowledge graph; and an admin dashboard
to moderate it all.

Built across 11 stages — see `PROJECT_MEMORY.md` for the full roadmap and
per-stage build/verification log, and `docs/` for architecture, API, and
component references.

## Tech stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 | Map UI, search, panels, admin dashboard |
| Map | Leaflet + react-leaflet + leaflet.markercluster | Rendering ~3,100 POIs without choking the browser |
| Backend | FastAPI (Python) | REST API serving the graph to the frontend |
| Database | Neo4j Community Edition | POI/Category/LGA graph; also holds users, saved places, reports |
| AI | Ollama (`llama3.2:3b`), local & free | Stage 8's natural-language → Cypher query interpreter |
| Auth | JWT (bcrypt-hashed passwords) | Signup/login, protected routes, admin allowlist |

No paid services anywhere in the stack — everything runs locally.

## Prerequisites

- Python 3.11+, Node 20+
- [Neo4j](https://neo4j.com/download/) — `brew install neo4j && brew services start neo4j`
- [Ollama](https://ollama.com/) — `brew install ollama && brew services start ollama && ollama pull llama3.2:3b`

## Setup

```bash
# Backend
cd backend
pip3 install -r requirements.txt
cp .env.example .env   # then edit .env — see SECURITY.md before setting real values
python3 ingest_data.py  # one-time: loads data/*.csv into Neo4j

# Frontend
cd ../frontend
npm install
```

## Running

```bash
# Terminal 1 — backend (http://localhost:8010)
cd backend && python3 -m uvicorn app.main:app --port 8010

# Terminal 2 — frontend (http://localhost:3000, or next free port)
cd frontend && npm run dev
```

Open the frontend URL — it launches directly into the map, no landing page.

To use an admin account, add your email to `ADMIN_EMAILS` in `backend/.env`
(comma-separated), sign up with that exact email, then find "Admin
dashboard" in the account menu.

## Documentation

- `PROJECT_MEMORY.md` — mission, rules, the 11-stage roadmap, and a log of
  what was built/verified/approved at each stage
- `docs/ARCHITECTURE.md` — system design and the reasoning behind every
  non-obvious decision, stage by stage
- `docs/API.md` — endpoint reference
- `docs/COMPONENTS.md` — frontend component tree and reuse notes
- `docs/PROJECT_MAP.md` — "where does X live" quick reference
- `SECURITY.md` — security posture, what's implemented, what's explicitly
  out of scope, and how to configure secrets before any deployment
