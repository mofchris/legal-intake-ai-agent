"""Tests for the deterministic helper rules in app.rules."""

from datetime import date

from app import rules
from app.models import IntakeSubmission

TODAY = date(2026, 6, 12)


def _sub(description, **overrides):
    data = {
        "client_name": "Test Client",
        "email": "t@example.com",
        "description": description,
        "preferred_contact_method": "either",
    }
    data.update(overrides)
    return IntakeSubmission(**data)


def test_missing_date_is_unknown_risk():
    assert rules.statute_risk_for_date(None, today=TODAY) == "unknown"
    assert rules.statute_risk_for_date("", today=TODAY) == "unknown"


def test_old_date_high_risk():
    assert rules.statute_risk_for_date("2020-01-01", today=TODAY) == "high"


def test_medium_age_date_medium_risk():
    # ~21 months before TODAY.
    assert rules.statute_risk_for_date("2024-09-01", today=TODAY) == "medium"


def test_recent_date_low_risk():
    assert rules.statute_risk_for_date("2026-04-01", today=TODAY) == "low"


def test_future_date_unknown_risk():
    assert rules.statute_risk_for_date("2027-01-01", today=TODAY) == "unknown"


def test_severe_keyword_increases_urgency():
    analysis = rules.build_demo_analysis(
        _sub("I needed surgery and was hospitalized after the crash.", incident_date="2026-03-01"),
        today=TODAY,
    )
    assert analysis.urgency_level == "high"


def test_government_commercial_minor_death_indicators():
    for text in [
        "A city bus struck my vehicle.",
        "A commercial truck hit my car.",
        "My child was injured in the car.",
        "My husband died in the crash.",
    ]:
        analysis = rules.build_demo_analysis(_sub(text, incident_date="2026-03-01"), today=TODAY)
        assert analysis.urgency_level == "high"


def test_classification_precedence():
    # Death outranks everything.
    assert rules.classify_case("uber crash where my father died") == "wrongful_death"
    # Catastrophic outranks rideshare/auto.
    assert rules.classify_case("uber rear-ended us, spinal cord injury") == "catastrophic_injury"
    # Rideshare outranks plain auto.
    assert rules.classify_case("uber crash, minor injuries") == "rideshare_accident"
    # Plain car crash.
    assert rules.classify_case("car collision at an intersection") == "auto_accident"
    # Premises.
    assert rules.classify_case("slipped on a wet floor at a store") == "premises_liability"
    # Nothing matches.
    assert rules.classify_case("I have a general legal question") == "other_unclear"


def test_post_process_raises_risk_for_old_date():
    base = rules.build_demo_analysis(_sub("car crash", incident_date="2020-01-01"), today=TODAY)
    # Pretend the model returned a too-low risk; post_process should raise it.
    weakened = base.model_copy(update={"statute_of_limitations_risk": "low", "urgency_level": "low"})
    fixed = rules.post_process(weakened, _sub("car crash", incident_date="2020-01-01"), today=TODAY)
    assert fixed.statute_of_limitations_risk == "high"
    assert fixed.urgency_level == "high"
