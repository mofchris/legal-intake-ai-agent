"""JSONL audit logging with optional PII redaction.

Every intake request is appended to ``logs/audit.jsonl``. API keys are never
logged. When ``LOG_REDACT_PII`` is true, email and phone values are masked.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from typing import Any, Optional

from app.config import PROMPT_VERSION, get_settings


def redact_email(email: Optional[str]) -> Optional[str]:
    if not email:
        return email
    local, sep, domain = email.partition("@")
    if not sep:
        return "***"
    visible = local[:2]
    return f"{visible}{'*' * max(len(local) - 2, 1)}@{domain}"


def redact_phone(phone: Optional[str]) -> Optional[str]:
    if not phone:
        return phone
    digits = re.sub(r"\D", "", phone)
    if len(digits) < 4:
        return "***"
    return f"***-***-{digits[-4:]}"


def _redact_payload(payload: dict[str, Any]) -> dict[str, Any]:
    redacted = dict(payload)
    if "email" in redacted:
        redacted["email"] = redact_email(redacted.get("email"))
    if "phone" in redacted:
        redacted["phone"] = redact_phone(redacted.get("phone"))
    return redacted


def log_intake(
    *,
    intake_id: str,
    request_payload: dict[str, Any],
    analysis_output: Optional[dict[str, Any]] = None,
    local_saved: bool = False,
    airtable_saved: bool = False,
    slack_notified: bool = False,
    error: Optional[str] = None,
) -> None:
    """Append one audit entry. Never raises — logging must not break a request."""
    settings = get_settings()
    payload = _redact_payload(request_payload) if settings.log_redact_pii else dict(request_payload)
    # Defense in depth: an API key must never appear in the audit log.
    payload.pop("openai_api_key", None)

    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "intake_id": intake_id,
        "model": settings.openai_model,
        "prompt_version": PROMPT_VERSION,
        "demo_mode": settings.demo_mode,
        "request_payload": payload,
        "analysis_output": analysis_output,
        "local_saved": local_saved,
        "airtable_saved": airtable_saved,
        "slack_notified": slack_notified,
        "error": error,
    }

    try:
        log_path = settings.audit_log_file
        log_path.parent.mkdir(parents=True, exist_ok=True)
        with log_path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry, ensure_ascii=False) + "\n")
    except OSError:
        # Logging failures are non-fatal.
        pass
