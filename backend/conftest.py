"""Shared pytest fixtures.

Each test runs in DEMO_MODE with an isolated temp SQLite DB and audit log, so
tests never touch the network or a shared database.
"""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def _isolated_settings(tmp_path, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "true")
    monkeypatch.setenv("OPENAI_API_KEY", "")
    monkeypatch.setenv("OPENAI_MODEL", "gpt-4.1-mini")
    monkeypatch.setenv("LOG_REDACT_PII", "true")
    monkeypatch.setenv("MAX_DESCRIPTION_CHARS", "10000")
    monkeypatch.setenv("DATABASE_PATH", str(tmp_path / "test.sqlite3"))
    monkeypatch.setenv("AUDIT_LOG_PATH", str(tmp_path / "audit.jsonl"))
    monkeypatch.setenv("SLACK_WEBHOOK_URL", "")
    monkeypatch.setenv("AIRTABLE_API_KEY", "")
    monkeypatch.setenv("AIRTABLE_BASE_ID", "")

    from app.config import get_settings

    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def client():
    from fastapi.testclient import TestClient

    from app import storage
    from app.main import app

    storage.init_db()
    return TestClient(app)


def reload_settings(monkeypatch, **env):
    """Helper: set env vars and clear the settings cache for a single test."""
    from app.config import get_settings

    for key, value in env.items():
        monkeypatch.setenv(key, value)
    get_settings.cache_clear()
    return get_settings()
