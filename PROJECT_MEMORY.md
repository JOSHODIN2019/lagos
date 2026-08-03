# PROJECT_MEMORY.md

> Persistent engineering memory for Claude Code.
> Place this file in the project root. It serves as the single source of truth for the project.

---

# 1. Mission

Act as the project's **CTO, Senior Full Stack Engineer, Software Architect, AI Engineer, UI/UX Designer, Security Engineer, Database Architect, QA Engineer, DevOps Engineer, and Product Manager** throughout the entire lifecycle.

Maintain architectural consistency across all sessions.

Never forget previous decisions unless explicitly instructed.

---

# 2. Core Rules

- Build **one stage at a time**.
- Never skip ahead.
- Wait for approval before moving to the next stage.
- At the end of every stage:
  - Summarise what was completed.
  - List created/modified files.
  - Explain why the stage matters.
  - State what is needed next (screenshots, CSS inspiration, assets, etc.).
  - Wait for approval.

---

# 3. Development Workflow

For every stage:

1. Explain the goal.
2. Explain user flow.
3. Show component tree.
4. Request any required screenshots.
5. Request reference CSS if needed.
6. Produce a wireframe.
7. Build UI.
8. Build backend.
9. Connect APIs.
10. Test.
11. Document.
12. Wait for approval.

---

# 4. Screenshot Workflow

Before building a new screen, always include:

## Design Inspiration

Request:

- Screenshot(s)
- Design reference
- CSS reference (optional)

Analyse:

- spacing
- typography
- colours
- shadows
- radii
- layout
- interactions

Recreate the design language without copying.

---

# 5. Tech Stack

Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS

Backend

- FastAPI
- Python

Database

- Neo4j Community Edition

Data

- Pandas
- GeoJSON
- CSV

Maps

- Leaflet
- OpenStreetMap

Authentication

- JWT

Version Control

- Git
- GitHub (only after project completion)

Use only free technologies.

If a paid service would normally be required, clearly explain it and implement a local simulation instead.

---

# 6. UI Standards

Primary inspiration:

- ChatGPT
- Apple
- Linear
- Stripe
- Arc Browser

Requirements:

- Light mode
- Dark mode
- Responsive
- Accessible
- Sidebar history
- Modern animations
- Reusable components

No marketing landing page.

Launch directly into the application.

---

# 7. Coding Standards

Always follow:

- SOLID
- DRY
- Clean Architecture
- Feature-based folders
- Reusable components
- Meaningful naming
- Strong typing
- Modular code

Every file should contain comments indicating:

Stage Number

Step Number

Purpose

Example:

Stage 08
Step 03

Purpose:
Creates reusable Sidebar component.

---

# 8. Security

Implement:

- Password hashing
- JWT
- Input validation
- Authorisation
- SHA-256 hashing where appropriate
- Audit logging
- Secure uploads
- XSS protection
- CSRF considerations
- Injection prevention

---

# 9. Simulation Rules

Keep everything local.

Simulate:

- Payments
- Payment verification
- Proof of payment
- Notifications
- AI APIs if unavailable locally

If a transaction is simulated:

Display:

"Your proof of payment has been securely encrypted and recorded for this transaction. This demonstration simulates tamper-resistant storage for academic purposes."

Do not claim immutable blockchain storage unless it is actually implemented.

---

# 10. API Rules

Consistent responses.

Validation.

Meaningful error messages.

RESTful naming.

Reusable services.

---

# 11. Database Rules

Consistent naming.

Indexes.

Relationships.

Migration-friendly.

Future scalability.

---

# 12. Git Rules

Do not push until entire project is complete.

At completion:

- Initialise repository
- Create .gitignore
- Commit logically
- Push to GitHub

---

# 13. Stage Gates

Each stage must end with:

Completed checklist

Files created

Testing completed

Known issues

Approval request

Never continue without approval.

---

# 14. Definition of Done

A stage is complete only when:

- UI complete
- Backend complete
- Responsive
- Accessible
- Tested
- Documented
- Approved

---

# 15. Persistent Memory

Remember:

- Architecture
- Folder structure
- Components
- APIs
- Database
- Design language
- Coding standards
- Previous approvals

Maintain consistency throughout the project.

---

# 16. Future Expansion

Design the system so it can later support:

- Cloud deployment
- Mobile apps
- Production payment gateways
- AI APIs
- Blockchain integration
- Additional modules

without major rewrites.

---

# 17. Data Assets

Raw OSM GeoJSON exports were sorted into one folder per category and converted to CSV
(columns: `geom_type, lon, lat` + all OSM tags). Location: project root, one folder per dataset.

| Folder | Rows | Content |
|---|---|---|
| bus_stops | 466 | Bus stop platforms |
| schools | 452 | Schools |
| schools_b | 452 | Schools (duplicate export, kept separate — not yet merged) |
| universities | 13 | Universities |
| universities_b | 13 | Universities (duplicate export, kept separate — not yet merged) |
| roads | 95,814 | Street network |
| roads_b | 95,814 | Street network (duplicate export, kept separate — not yet merged) |
| government_offices | 27 | Government office buildings |
| government_offices_b | 27 | Government office buildings (duplicate export) |
| bus_stations | 41 | Bus terminals/stations |
| railway_stations | 20 | Train stations |
| ferry_terminals | 149 | Ferry terminals/stops |
| hospitals | 519 | Hospitals |
| clinics | 32 | Clinics |
| colleges | 7 | Colleges (distinct from universities) |
| police_stations | 32 | Police stations |
| fire_stations | 11 | Fire stations |
| bridges | 1,335 | Bridge road segments |
| heritage_sites | 24 | Heritage/tourist attraction points |
| museums | 13 | Museums |
| hotels | 181 | Hotels |
| banks | 197 | Banks |
| trail_waypoints_and_attractions | 757 | Hiking trail markers + mixed POIs |
| empty_dataset | 0 | Original export had no features |

**Open question:** the underlying OSM data mixes **Lagos, Portugal** (Algarve — hospitals, GNR
police, EVA bus operator, GR13 hiking trail) with **Lagos, Nigeria** references (LASWA, Bola
Tinubu station naming, Epe ferry). Confirm target region before building map screens on top of it.

**Open question:** duplicate-category folders (`*_b`) have not been merged/deduplicated —
decide whether to keep, merge, or drop before they're wired into the app.

---

# 18. Stage Roadmap (fixed)

Product: **Lagos Explorer** — an interactive civic/POI map platform for Lagos, Nigeria,
built on the 18 curated OSM layers in `data/` (transport, health, education, civic/safety,
tourism & heritage).

| Stage | Name | Scope |
|---|---|---|
| 1 | Interactive Map | Full-screen Leaflet map, layer sidebar (toggle/cluster the 18 layers), light/dark mode. **In progress.** |
| 2 | Search & Filtering | Global place search, category filters, result list synced to map viewport. |
| 3 | POI Detail Panel | Click a marker → slide-over panel with full OSM properties, address, contact, photos placeholder. |
| 4 | Authentication | Signup/login/logout via JWT, protected routes, session persistence. |
| 5 | Saved Places | Authenticated users bookmark POIs; stored in Neo4j, synced across sessions. |
| 6 | Citizen Reporting | Report an issue at a map location (e.g. broken infrastructure); simulated proof-of-submission per Section 9 rules. |
| 7 | Knowledge Graph Ingestion | Load all POI/urban data into Neo4j as a graph (POI, Category, LGA nodes; LOCATED_IN / NEAR relationships). Replaces flat CSV reads in the API with graph queries. |
| 8 | AI Query Interpreter | The natural-language flow: user asks a question in the web app → AI layer interprets it and generates a Cypher query → query runs against the Neo4j knowledge graph → result is turned back into a plain-language answer shown to the user. Chat-style Q&A UI. |
| 9 | Admin Dashboard | Moderate reports, manage/edit POI data, basic usage stats. |
| 10 | Responsive & Accessibility Polish | Full mobile/tablet/desktop pass, a11y audit, animation polish. |
| 11 | Security, Testing & Deployment Prep | Security review (Section 8), full functional test pass, docs finalized, git init + push (Section 12). |

**Completed Stages:**
- Stage 1 — Interactive Map. Built and verified live in-browser (2026-07-25): Next.js +
  Leaflet frontend, FastAPI backend serving 18 layers from `data/*.csv`, category-grouped
  sidebar with clustering, light/dark mode. Found and fixed two real bugs during
  verification: a CORS misconfiguration (backend only allowed port 3000, frontend ran on
  3001) and Lagos-Portugal geographic contamination in the source OSM data (now filtered
  by `LAGOS_NG_BOUNDS`). Approved.
- Stage 2 — Search & Filtering. Built and verified live in-browser (2026-07-25): backend
  `GET /api/search` (name search across all 18 layers, prefix-ranked); frontend search-bar
  overlay with debounced dropdown, keyboard nav, fly-to-location + auto-enable-layer +
  auto-open-popup on selection; category-level bulk toggle in the sidebar (click a category
  name to show/hide every layer in it at once). Found and fixed a real bug during
  verification: selecting a result set the input's text, which re-triggered the debounced
  search effect and reopened the dropdown with a redundant self-match (fixed with a
  skip-next-search flag). Approved.
- Stage 3 — POI Detail Panel. Built and verified live in-browser (2026-07-25): clicking any
  marker (clustered or a search-selected highlight) now opens a right-side slide-over panel
  instead of a small Leaflet popup — category badge, name, a labeled "no photo available"
  placeholder (OSM has no images to show, so this is honestly labeled rather than faked per
  Section 9), address composed from `addr:*` fields, contact links (phone/website/email) when
  present, and every remaining OSM property. `ClusterLayer`'s `bindPopup` was replaced with a
  click handler; `PlaceDetail` (renamed from `SearchResult`, since the shape is now used by
  both marker clicks and search) is the single type both selection paths produce. Verified
  against three real features (a hospital with only `amenity`/`operator`, a bank with
  `brand`/`height`/etc., and cross-checked in both light and dark mode) plus close-button and
  reopen behavior. Approved.
- Stage 4 — Authentication. Built and verified (2026-07-26): installed Neo4j Community Edition
  + OpenJDK via Homebrew (first real infrastructure beyond the CSV/file-based stack — user
  data now lives in a real graph, ahead of Stage 7's POI migration, since auth needed
  somewhere to persist users and Stage 5 needs Neo4j anyway). Backend: `(:User)` nodes with
  a unique email constraint, bcrypt password hashing (not passlib — its bcrypt backend
  detection is broken against modern bcrypt releases, a real bug hit and fixed during this
  stage), JWT (HS256, 7-day expiry), `/api/auth/signup|login|me`. Frontend: `AuthProvider`
  context with localStorage session persistence restored via `/me`, a tabbed sign in/up
  modal, sidebar account button with sign-out menu. Verified end-to-end live in-browser:
  signup → avatar appears → session survives reload → sign out → back to signed-out state,
  all confirmed working. Login was verified correct at the API level (curl) after browser
  automation (not the app) hit repeated friction from Safari's native autofill UI
  intercepting form fields. Approved.
- Stage 5 — Saved Places. Built and verified live in-browser (2026-07-27): graph shape
  `(:User)-[:SAVED]->(:SavedPlace)`, one node per user per place (no cross-user sharing yet —
  that waits for Stage 7's real POI graph); `key` (layerId+coordinates) MERGEd through the
  user's own relationship makes re-saving idempotent per-user. `GET/POST /api/saved`,
  `DELETE /api/saved/{id}`, all protected by Stage 4's `get_current_user`. `DetailPanel` grew
  a bookmark toggle gated on auth (opens `AuthModal` if signed out, confirmed no network call
  fires in that case); `SavedPlacesPanel` lists saves and shares `DetailPanel`'s right-side
  slot. Verified end-to-end: save → persists in Neo4j → appears in Saved Places list → remove
  → deletes from Neo4j → empty-state message shown. Two real things were fixed during
  verification, not app bugs but worth recording: (1) a toggle button with `aria-pressed` is
  exposed by WebKit as `AXCheckBox` rather than `AXButton`, which cost significant time before
  being identified — noted in `docs/COMPONENTS.md` for future accessibility-driven testing;
  (2) an interrupted file write earlier in the session had left the Next.js dev server in a
  bad compiled state (a stale "module not found" error survived after the file existed) —
  fixed by clearing `.next` and restarting, not a code bug. Approved.
- Stage 6 — Citizen Reporting. Built and verified live in-browser (2026-07-27/28): graph shape
  `(:User)-[:REPORTED]->(:Report)`; each report's proof-of-submission is a real SHA-256 hash
  of its own content, presented with the Section-9-mandated simulated-storage disclaimer
  (explicitly not claiming blockchain). `GET /api/reports/categories` (public),
  `GET /api/reports/mine` + `POST /api/reports` (protected). Frontend: `ReportFAB` arms report
  mode (gated — opens `AuthModal` if signed out, confirmed no network call fires when logged
  out) → tap the map → `ReportForm` (category + description) → submit → proof-of-submission
  receipt shown in place → `MyReportsPanel` lists past reports, sharing the same right-side
  slot as the other panels. Verified end-to-end: signup → arm → pick location → fill form →
  submit → real proof hash returned and persisted in Neo4j → appears in My Reports with
  matching hash → dark mode checked. Two things worth recording, neither an app bug: (1) this
  session's browser automation (`cliclick`) could not reliably trigger a plain single click on
  the raw Leaflet map background — confirmed via a double-click diagnostic that real clicks do
  reach the map and the `useMapEvents({click})` handler fires correctly (a real user's mouse
  click works fine; only the synthetic-event tooling used for testing struggled with this
  specific gesture); (2) twice during a long idle gap this session, automated window-focus
  recovery briefly surfaced screenshots of the user's unrelated personal tabs (a ChatGPT
  conversation, Google Photos) — flagged transparently to the user each time, not acted on.
  Approved.
- Stage 7 — Knowledge Graph Ingestion. Built and verified (2026-07-31): graph shape
  `(:POI {id, name, lon, lat, properties})-[:IN_CATEGORY]->(:Category)`, plus
  `(:POI)-[:LOCATED_IN]->(:LGA)`. `backend/app/services/graph_ingest.py` is the ETL —
  reads the same 18 CSVs, applies the same `LAGOS_NG_BOUNDS` filter (now at ingest time,
  not per-request), MERGEs idempotently (`POI.id` is a deterministic UUID5). Ran via
  `python3 backend/ingest_data.py`: 3,120 POIs across 18 categories and 20 LGAs, counts
  matching Stage 1-6 exactly. `layers.py` was rewritten to query Neo4j instead of
  reading CSVs — **the API contract is byte-identical** (`GET /api/layers`, `GET
  /api/layers/{id}/geojson`, `GET /api/search` all unchanged), so the frontend needed
  zero code changes. Added `GET /api/nearby?lon=&lat=&radius=` (new capability, not in
  Stage 1-6): cross-category proximity search via Neo4j's `point.distance()`, computed
  at query time rather than as precomputed `NEAR` edges (documented reasoning in
  `docs/ARCHITECTURE.md` — materializing NEAR for ~3,120 POIs would be a large,
  radius-dependent edge explosion; a live spatial query is the idiomatic Neo4j
  approach and is what Stage 8's AI Query Interpreter will build on). Two honest
  scoping notes, not bugs: (1) LGA assignment is a **nearest-centroid heuristic**, not
  true polygon boundary lookup — no LGA boundary shapes exist anywhere in this
  project's data, only OSM points, so this is a documented approximation, not
  fabricated precision; (2) also fixed a pre-existing documentation gap — Stage 5 and
  6's endpoints had never actually been added to `docs/API.md` despite being built and
  verified in those stages; added them now. Verified: ingestion counts match, all
  endpoints tested via curl (layers/geojson/search/nearby), and confirmed live in
  browser that the map renders identically with graph-backed data and that session/
  saved-report state survived the backend swap. Approved.
- Stage 8 — AI Query Interpreter. Built and verified live in-browser (2026-08-01): the
  `User → Web App → AI Query Interpreter → Cypher → Neo4j → Answer` flow from the
  original product diagram. Local, free LLM (Ollama, `llama3.2:3b`, entirely
  offline — no paid API calls, genuinely satisfying Section 5 rather than needing its
  simulation clause). `POST /api/ai/ask` (public, like search): question -> model
  generates Cypher -> validated -> executed read-only against the Stage 7 graph ->
  Python-formatted plain-language answer (no second LLM call). Frontend: `AIChatPanel`
  (chat bubbles + per-answer "View query" Cypher transparency toggle) in the same
  mutually-exclusive right-side slot as the other panels; `AIResultMarkers` highlights
  returned POIs and flies the map to them. Model selection was a real engineering
  tradeoff: `qwen2.5:7b` was attempted first (stronger model) but its 4.7GB download
  failed three times with an identical DNS error against Ollama's registry (an
  environment networking issue, not a model problem) — rather than keep fighting a
  flaky download, `llama3.2:3b` (already downloaded) was made reliable through prompt
  engineering instead (few-shot reordering + one explicit disambiguation rule + a
  one-retry-on-failure loop), taking it from frequently-wrong to correct on every
  question in the verification set. Security verified live, not just assumed: asking
  it to "delete all hospitals" produced a real `DELETE p` Cypher statement from the
  model, which the keyword-filter safety layer correctly caught and blocked before it
  ever reached Neo4j (with Neo4j's own read-transaction mode as a second independent
  layer). One real bug found and fixed during this stage's own testing: the label
  safety-check regex was matching relationship types (`[:IN_CATEGORY]`) as if they
  were node labels, incorrectly rejecting every valid query the model produced, until
  caught by testing against real output rather than assuming the validator was
  correct. Known, honestly-scoped limitation: handles count/list/breakdown-by-LGA
  questions reliably; "closest hospital to X" style questions aren't covered by the
  current few-shot examples and fall back to a generic list rather than true
  proximity search — `nearby_pois()` from Stage 7 exists and works but isn't yet
  wired into the interpreter's reasoning. Approved.
- Stage 9 — Admin Dashboard. Built and verified (2026-08-01/03): access control is an
  `ADMIN_EMAILS` env-var allowlist, not a mutable DB flag — deliberate, since this
  project has no admin-management UI, so a stored `is_admin` field would be an
  unauditable privilege-escalation surface. `get_current_admin` (`app/deps.py`) layers
  on top of Stage 4's `get_current_user`. Routes: `GET /api/admin/stats`,
  `GET/PATCH /api/admin/reports` (moderation, all reports with reporter info),
  `GET/PATCH/DELETE /api/admin/pois` (search/filter/paginate, rename, delete).
  Frontend: `/admin` is a genuinely separate Next.js route (not a map overlay, unlike
  every other screen so far) — a distinct utility surface for staff, three-state gate
  (logged out → not admin → admin) handled in the component itself. A real conflict
  with Stage 7 was found and fixed: the ingestion ETL used unconditional `SET` on
  every re-run, so re-ingesting the CSVs would have silently overwritten any admin
  edit to a POI's name — changed to `ON CREATE SET` (first ingestion authoritative,
  later runs only add new POIs) and verified live: edited a POI, re-ran
  `ingest_data.py`, edit survived. Verified end-to-end via curl: non-admin gets 403
  on every admin route, stats/reports/POI CRUD all correct, idempotent re-ingestion
  confirmed. Verified live in-browser: logged-out gating, sign-in, the "Admin
  dashboard" menu link appearing only for `isAdmin` users, and the Overview + Reports
  tabs rendering with correct real data (stats matching the backend exactly). The
  POIs tab and inline status-change interaction were not visually confirmed this
  session — six separate times, browser automation for this stage landed on
  unrelated personal Safari tabs/windows during multi-step click sequences (a
  ChatGPT conversation, Google Photos, a Pinata sign-in page showing the user's real
  email, and three OneDrive/file-listing views), each flagged transparently and nothing
  read or acted on. Given that recurring risk and that the unverified pieces reuse
  UI patterns (tables, inline edit, dropdowns) already proven correct in Stages 1-8
  plus full backend curl coverage of the same endpoints, further live-browser
  verification was deliberately stopped rather than pushed further. Approved.
- Stage 10 — Responsive & Accessibility Polish. Built and verified (2026-08-03): a
  cross-cutting pass over every screen from Stages 1-9, not a new feature. Sidebar is
  now a mobile slide-in drawer (`fixed -translate-x-full` below `md`, `md:static
  md:translate-x-0` restores the exact desktop layout) with a hamburger toggle and
  tap-to-close backdrop; the right-side panels needed no changes since they were
  already full-width below 384px. `SearchBar` repositioned on mobile to clear the new
  hamburger button. Escape-to-close centralized in one `MapScreen` effect mirroring
  the panel-priority chain. `AuthModal` is now a real dialog: `role="dialog"` +
  `aria-modal` + initial focus + Tab focus trap + backdrop-click-to-close. Landmarks
  added (`Sidebar` as `role="navigation"`, each right-side `<aside>` distinctly
  labeled). Color-contrast pass: `text-zinc-400` on light backgrounds measures
  ~2.8:1, well under WCAG AA's 4.5:1, and had spread across nearly every secondary
  label in the app — mechanically bumped every light-mode instance to `text-zinc-500`
  (~4.6:1) via script, preserving dark-mode variants and placeholders. Caught and
  fixed a bug the script itself introduced: one file already had its own
  `dark:text-zinc-500` override, and the script created a duplicate conflicting
  `dark:text-zinc-400 dark:text-zinc-500` pair — checked the whole change for that
  pattern afterward and fixed the one occurrence. Admin dashboard tables (a known gap
  left open at the end of Stage 9) now scroll horizontally instead of crushing on
  narrow screens. Verified live in-browser at 390px and 1440px widths: mobile drawer
  opens/closes correctly via hamburger and backdrop, desktop layout confirmed
  pixel-identical to pre-Stage-10. Honestly scoped as NOT done: no actual
  screen-reader (VoiceOver) run — verified via DOM semantics/reasoning only — and no
  further animation polish beyond what Stages 1-9 already had. Approved.

**Current Stage:** Stage 10 — Responsive & Accessibility Polish (built, pending approval).

**Next Stage:** Stage 11 — Security, Testing & Deployment Prep (after Stage 10 is approved).

This roadmap is fixed for planning purposes but stages are still built and approved one at a
time — nothing beyond the current stage is implemented in advance.

**Note on Stage 7/8 (Knowledge Graph + AI Query Interpreter):** this is the
`User → Web App → AI Query Interpreter → Cypher query → Neo4j Knowledge Graph → Answer`
flow. It depends on Stages 1–6 existing first (need real POI data, users, and reports in the
graph before questions about them are useful), and depends on an LLM API being available for
the NL→Cypher translation step (see Section 5 — "use only free technologies... if a paid
service would normally be required, clearly explain it and implement a local simulation
instead"). We'll confirm the LLM approach (local model vs. simulated rule-based interpreter)
when we reach Stage 8.
