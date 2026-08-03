# Security

This project was built as a local/academic demo (see `PROJECT_MEMORY.md`
Section 5 — "free technologies only," everything runs on localhost). This
document is an honest account of what's implemented, what's deliberately
out of scope, and what must change before this ever runs anywhere beyond
localhost.

## Implemented

- **Password hashing**: bcrypt (`backend/app/services/auth.py`), not a
  fast hash — deliberately chosen over plain SHA-256, which is unsuitable
  for passwords since it's fast to brute-force.
- **JWT auth**: HS256, 7-day expiry. `get_current_user` /
  `get_current_admin` (`backend/app/deps.py`) protect every route that
  needs a signed-in (or admin) user.
- **Admin access is an email allowlist** (`ADMIN_EMAILS` env var), not a
  stored/mutable database flag — there's no admin-management UI in this
  project, so a mutable `is_admin` column would be an unauditable
  privilege-escalation surface. See `docs/ARCHITECTURE.md` Stage 9.
- **Input validation**: Pydantic models on every request body, with
  explicit length limits added in Stage 11 where they were missing
  (`AskRequest.question` — unbounded length was a real resource-exhaustion
  vector since it's embedded directly in the LLM prompt; `SavePlaceRequest`
  fields and its `properties` dict).
- **Cypher injection**: every query parameterizes user-supplied values
  (`$paramName`, never string-interpolated into the query text). The one
  place that builds a query with an f-string (`admin.py`'s `list_pois`)
  only interpolates a *fixed* WHERE-clause structure, never the actual
  values — audited line-by-line in Stage 11.
- **AI-generated Cypher (Stage 8) gets three independent layers of
  defense**, verified live by asking it to "delete all hospitals" and
  confirming the model's real `DELETE p` statement was caught:
  1. Keyword filter rejects `CREATE`/`MERGE`/`SET`/`DELETE`/`REMOVE`/`DROP`/`CALL`.
  2. Label filter rejects any node label outside `{POI, Category, LGA}` —
     it can never see or touch `User`, `Report`, or `SavedPlace` data.
  3. Neo4j's own read-transaction mode rejects writes server-side even if
     both application-level checks were somehow bypassed.
- **XSS**: no `dangerouslySetInnerHTML` anywhere in the frontend (grepped
  and confirmed in Stage 11) — every piece of user-generated content
  (report descriptions, POI names, chat messages) renders through React's
  default escaping.
- **CSRF**: not a meaningful risk for this API. Auth is a JWT sent via
  `Authorization: Bearer <token>` (attached by frontend JS reading
  `localStorage`), not a cookie — a browser won't auto-attach that header
  cross-site the way it does cookies, which is what CSRF exploits.
- **Audit logging** (Stage 11, `backend/app/services/audit.py`): auth
  signup/login success/failure, and every admin action (POI edit/delete,
  report status change) are logged with who/what/when. Caught and fixed a
  real bug while adding this — a bare `logging.getLogger("audit")` was
  silently dropping every `.info()` call because Python's root logger
  defaults to WARNING with no handler; confirmed via direct testing, not
  assumed, then fixed with an explicit level + handler.
- **Secrets are environment-driven**, loaded from a local `.env`
  (`python-dotenv`) that is gitignored — see `backend/.env.example` for
  every variable. `config.py` logs a startup warning if `JWT_SECRET` is
  still the insecure development fallback.
- **CORS**: explicit-origin allowlist (`CORS_ORIGINS` env var) takes
  priority when set; otherwise falls back to a permissive "any localhost
  port" regex, since the frontend's dev port isn't fixed. The regex
  fallback is fine for local dev, **not** for anything beyond it.

## Not implemented — explicitly out of scope

- **Secure uploads**: N/A — this app has no file upload feature anywhere.
- **Rate limiting**: not implemented on any endpoint (login, signup, the
  AI query interpreter). Acceptable for a local demo with no public
  exposure; would be a real gap before any public deployment.
- **Real screen-reader/VoiceOver testing**: Stage 10's accessibility work
  was verified via DOM semantics and manual reasoning, not an actual
  assistive-technology run.
- **Immutable/blockchain proof storage**: report "proof of submission"
  (Stage 6) is a real SHA-256 hash of the report's own content, but it is
  explicitly *not* claimed to be blockchain or tamper-proof storage — the
  UI says so outright, per Section 9's simulation rules.

## Before this runs anywhere beyond localhost

1. Set a real, random `JWT_SECRET` in `.env` (`python3 -c "import secrets;
   print(secrets.token_hex(32))"`) — the code will start with the insecure
   default otherwise and log a warning.
2. Set `CORS_ORIGINS` to the real frontend origin(s) — do not rely on the
   localhost-regex fallback.
3. Change `NEO4J_PASSWORD` from the dev default.
4. Add rate limiting to `/api/auth/login`, `/api/auth/signup`, and
   `/api/ai/ask` at minimum.
5. Review `ADMIN_EMAILS` — it's empty by default (no admins) until set.
