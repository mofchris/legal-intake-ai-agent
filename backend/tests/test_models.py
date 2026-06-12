"""Validation tests for the Pydantic models."""

import pytest
from pydantic import ValidationError

from app.models import IntakeAnalysis, IntakeSubmission


def _valid_submission(**overrides):
    data = {
        "client_name": "Jane Doe",
        "email": "jane@example.com",
        "phone": "555-555-5555",
        "incident_date": "2024-03-15",
        "injury_type": "Neck injury",
        "description": "I was rear-ended at a red light.",
        "preferred_contact_method": "email",
    }
    data.update(overrides)
    return data


def test_valid_submission_passes():
    sub = IntakeSubmission(**_valid_submission())
    assert sub.client_name == "Jane Doe"
    assert sub.preferred_contact_method == "email"


def test_missing_client_name_fails():
    with pytest.raises(ValidationError):
        IntakeSubmission(**_valid_submission(client_name=None))


def test_whitespace_client_name_fails():
    with pytest.raises(ValidationError):
        IntakeSubmission(**_valid_submission(client_name="   "))


def test_missing_email_and_phone_fails():
    with pytest.raises(ValidationError):
        IntakeSubmission(**_valid_submission(email=None, phone=None, preferred_contact_method="either"))


def test_whitespace_email_and_phone_fails():
    with pytest.raises(ValidationError):
        IntakeSubmission(**_valid_submission(email=None, phone="   ", preferred_contact_method="either"))


def test_invalid_email_format_fails():
    with pytest.raises(ValidationError):
        IntakeSubmission(**_valid_submission(email="not-an-email"))


def test_preferred_email_without_email_fails():
    with pytest.raises(ValidationError):
        IntakeSubmission(**_valid_submission(email=None, phone="555-555-5555", preferred_contact_method="email"))


def test_preferred_phone_without_phone_fails():
    with pytest.raises(ValidationError):
        IntakeSubmission(**_valid_submission(phone=None, preferred_contact_method="phone"))


def test_overlong_description_fails():
    with pytest.raises(ValidationError):
        IntakeSubmission(**_valid_submission(description="x" * 10_001))


def test_invalid_incident_date_fails():
    with pytest.raises(ValidationError):
        IntakeSubmission(**_valid_submission(incident_date="03/15/2024"))


def test_future_incident_date_is_accepted_at_model_level():
    # Future dates are allowed by the model; rules flag them as unknown later.
    sub = IntakeSubmission(**_valid_submission(incident_date="2099-01-01"))
    assert sub.incident_date == "2099-01-01"


def test_invalid_case_type_fails():
    with pytest.raises(ValidationError):
        IntakeAnalysis(
            client_name="Jane",
            case_type="car_crash",
            urgency_level="low",
            statute_of_limitations_risk="low",
        )


def test_invalid_urgency_level_fails():
    with pytest.raises(ValidationError):
        IntakeAnalysis(
            client_name="Jane",
            case_type="auto_accident",
            urgency_level="urgent",
            statute_of_limitations_risk="low",
        )
