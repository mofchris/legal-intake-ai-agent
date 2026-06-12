"""API tests. OpenAI is never called — demo mode or a monkeypatched client."""

import json

from conftest import reload_settings

VALID_BODY = {
    "client_name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "555-555-5555",
    "incident_date": "2024-03-15",
    "injury_type": "Neck and back injury",
    "description": "I was rear-ended at a red light and now have pain.",
    "preferred_contact_method": "email",
}


def test_health_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_intake_validation_error(client):
    resp = client.post("/api/intake", json={"description": "no name or contact"})
    assert resp.status_code == 422


def test_intake_demo_mode(client):
    resp = client.post("/api/intake", json=VALID_BODY)
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "analyzed"
    assert body["analysis"]["case_type"] in {
        "auto_accident", "rideshare_accident", "premises_liability",
        "catastrophic_injury", "wrongful_death", "other_unclear",
    }
    assert body["integrations"]["local_saved"] is True
    assert body["integrations"]["slack_notified"] is False
    assert body["intake_id"]


def test_intake_config_error_when_key_missing(client, monkeypatch):
    reload_settings(monkeypatch, DEMO_MODE="false", OPENAI_API_KEY="")
    resp = client.post("/api/intake", json=VALID_BODY)
    assert resp.status_code == 503
    assert resp.json()["detail"]["code"] == "CONFIG_MISSING_API_KEY"


def test_intake_handles_invalid_model_output(client, monkeypatch):
    reload_settings(monkeypatch, DEMO_MODE="false", OPENAI_API_KEY="test-key")
    monkeypatch.setattr("app.openai_client._call_openai", lambda messages: "this is not json")
    resp = client.post("/api/intake", json=VALID_BODY)
    assert resp.status_code == 502
    assert resp.json()["detail"]["code"] == "AI_INVALID_JSON"


def test_intake_with_mocked_valid_output(client, monkeypatch):
    reload_settings(monkeypatch, DEMO_MODE="false", OPENAI_API_KEY="test-key")
    fake = {
        "client_name": "Jane Doe",
        "case_type": "car_crash",  # wrong enum -> normalized to auto_accident
        "incident_date": "2024-03-15",
        "injury_summary": "Neck pain.",
        "liability_summary": "Other driver likely at fault.",
        "urgency_level": "medium",
        "statute_of_limitations_risk": "low",
        "missing_information": [],
        "recommended_next_step": "Schedule a call.",
        "client_follow_up_email": "Dear Jane, ...",
        "internal_summary": "Auto rear-end.",
        "analysis_summary": "Rear-end collision.",
    }
    monkeypatch.setattr("app.openai_client._call_openai", lambda messages: json.dumps(fake))
    resp = client.post("/api/intake", json=VALID_BODY)
    assert resp.status_code == 200
    assert resp.json()["analysis"]["case_type"] == "auto_accident"


def test_list_intakes_empty(client):
    resp = client.get("/api/intakes")
    assert resp.status_code == 200
    assert resp.json() == []


def test_list_and_get_intake(client):
    created = client.post("/api/intake", json=VALID_BODY).json()
    intake_id = created["intake_id"]

    listed = client.get("/api/intakes")
    assert listed.status_code == 200
    assert len(listed.json()) == 1

    one = client.get(f"/api/intakes/{intake_id}")
    assert one.status_code == 200
    assert one.json()["id"] == intake_id
    assert one.json()["submission"]["client_name"] == "Jane Doe"


def test_get_unknown_intake_404(client):
    resp = client.get("/api/intakes/does-not-exist")
    assert resp.status_code == 404
    assert resp.json()["detail"] == "Intake record not found"
