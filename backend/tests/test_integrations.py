"""Tests for optional Slack/Airtable integrations and their fail-safe behavior."""

import requests

from app import integrations
from app.config import get_settings
from app.models import IntakeAnalysis, IntakeSubmission
from conftest import reload_settings

SUBMISSION = IntakeSubmission(
    client_name="Jane Doe",
    email="jane@example.com",
    description="Rear-ended at a light.",
    preferred_contact_method="email",
)
ANALYSIS = IntakeAnalysis(
    client_name="Jane Doe",
    case_type="auto_accident",
    incident_date="2026-04-01",
    urgency_level="low",
    statute_of_limitations_risk="low",
    internal_summary="Auto rear-end.",
    recommended_next_step="Schedule a call.",
)


def test_missing_slack_webhook_returns_false():
    assert get_settings().slack_webhook_url == ""
    assert integrations.send_slack_notification(SUBMISSION, ANALYSIS, "id-1") is False


def test_slack_network_failure_returns_false(monkeypatch):
    reload_settings(monkeypatch, SLACK_WEBHOOK_URL="https://hooks.slack.test/abc")

    def boom(*args, **kwargs):
        raise requests.RequestException("network down")

    monkeypatch.setattr(integrations.requests, "post", boom)
    assert integrations.send_slack_notification(SUBMISSION, ANALYSIS, "id-1") is False


def test_missing_airtable_env_returns_false():
    assert integrations.save_to_airtable(SUBMISSION, ANALYSIS, "id-1") is False


def test_airtable_failure_returns_false(monkeypatch):
    reload_settings(
        monkeypatch,
        AIRTABLE_API_KEY="key",
        AIRTABLE_BASE_ID="base",
        AIRTABLE_TABLE_NAME="Intake Records",
    )

    def boom(*args, **kwargs):
        raise requests.RequestException("auth failed")

    monkeypatch.setattr(integrations.requests, "post", boom)
    assert integrations.save_to_airtable(SUBMISSION, ANALYSIS, "id-1") is False


def test_intake_succeeds_when_integration_fails(client, monkeypatch):
    # Slack is configured but the network call fails; the intake must still succeed.
    reload_settings(monkeypatch, DEMO_MODE="true", SLACK_WEBHOOK_URL="https://hooks.slack.test/abc")

    def boom(*args, **kwargs):
        raise requests.RequestException("network down")

    monkeypatch.setattr(integrations.requests, "post", boom)

    resp = client.post(
        "/api/intake",
        json={
            "client_name": "Jane Doe",
            "email": "jane@example.com",
            "description": "Rear-ended at a light.",
            "preferred_contact_method": "email",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["integrations"]["local_saved"] is True
    assert body["integrations"]["slack_notified"] is False
