"""
Stage 04
Step 01

Purpose:
Central place for environment-driven settings — Neo4j connection and JWT
secret. Values come from environment variables (loaded from a local,
gitignored `.env` if present — see `.env.example`), with dev-friendly
fallback defaults so the app still runs out of the box.
"""

import logging
import os

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "lagos-explorer-dev")

_INSECURE_DEFAULT_JWT_SECRET = "dev-only-insecure-secret-change-me"
JWT_SECRET = os.environ.get("JWT_SECRET", _INSECURE_DEFAULT_JWT_SECRET)
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

if JWT_SECRET == _INSECURE_DEFAULT_JWT_SECRET:
    logger.warning(
        "JWT_SECRET is unset — using the insecure development default. "
        "Set a real JWT_SECRET in .env before this app is ever exposed "
        "beyond localhost."
    )

# Stage 08 — local, free LLM for NL -> Cypher translation (Ollama, run via
# `brew services start ollama`). No paid API calls anywhere in this flow.
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:3b")

# Stage 09 — admin access is an email allowlist, not a stored/mutable
# database flag. There's no admin-management UI in this project, so a
# mutable is_admin column would be a privilege-escalation surface with no
# way to audit who set it; an env-configured allowlist is simpler and safer
# for this scope. Comma-separated, case-insensitive.
ADMIN_EMAILS = {
    e.strip().lower()
    for e in os.environ.get("ADMIN_EMAILS", "").split(",")
    if e.strip()
}

# Stage 11 — CORS. Explicit origins take priority when set (required before
# this app is ever exposed beyond localhost); otherwise fall back to the
# permissive "any localhost port" regex, since the frontend's dev port
# isn't fixed (see docs/ARCHITECTURE.md).
CORS_ORIGINS = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()
]
