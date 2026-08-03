"""
Stage 11
Step 01

Purpose:
Minimal audit logging for security-relevant events (Section 8's "audit
logging" requirement) — auth outcomes and admin actions. Deliberately not a
database table: these are operational logs for tracing "who did what,
when," not user-facing data, so stdout (captured by uvicorn's log handler)
is the right destination for this project's scope.
"""

import logging
import sys

audit_logger = logging.getLogger("audit")
# Stage 11: Python's root logger has no handler and defaults to WARNING, so
# a plain getLogger("audit").info(...) is silently dropped no matter what —
# confirmed by testing, not assumed. Configure this logger explicitly
# rather than relying on root logging setup (uvicorn configures its own
# named loggers the same way, for the same reason).
audit_logger.setLevel(logging.INFO)
if not audit_logger.handlers:
    _handler = logging.StreamHandler(sys.stdout)
    _handler.setFormatter(logging.Formatter("AUDIT %(asctime)s %(message)s"))
    audit_logger.addHandler(_handler)
    audit_logger.propagate = False


def log_event(event: str, **fields: object) -> None:
    detail = " ".join(f"{k}={v}" for k, v in fields.items())
    audit_logger.info("%s %s", event, detail)
