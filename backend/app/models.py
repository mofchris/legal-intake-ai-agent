"""Pydantic models — the request/response contract shared with the frontend."""

from __future__ import annotations

from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator

from app.config import get_settings

# Enum value sets (kept as tuples so they can be reused for normalization/tests).
CASE_TYPES = (
    "auto_accident",
    "rideshare_accident",
    "premises_liability",
    "catastrophic_injury",
    "wrongful_death",
    "other_unclear",
)
URGENCY_LEVELS = ("low", "medium", "high")
STATUTE_RISKS = ("low", "medium", "high", "unknown")
CONTACT_METHODS = ("email", "phone", "either")

CaseType = Literal[
    "auto_accident",
    "rideshare_accident",
    "premises_liability",
    "catastrophic_injury",
    "wrongful_death",
    "other_unclear",
]
UrgencyLevel = Literal["low", "medium", "high"]
StatuteRisk = Literal["low", "medium", "high", "unknown"]
ContactMethod = Literal["email", "phone", "either"]


def _blank_to_none(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


class IntakeSubmission(BaseModel):
    """A client intake submitted from the form."""

    client_name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    incident_date: Optional[str] = None
    injury_type: Optional[str] = None
    description: str
    preferred_contact_method: ContactMethod = "either"

    @field_validator("client_name")
    @classmethod
    def _name_not_blank(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("client_name must not be blank")
        return v

    @field_validator("phone", "injury_type", mode="before")
    @classmethod
    def _normalize_optional(cls, v: Optional[str]) -> Optional[str]:
        return _blank_to_none(v)

    @field_validator("description")
    @classmethod
    def _description_valid(cls, v: str) -> str:
        v = (v or "").strip()
        if not v:
            raise ValueError("description must not be empty")
        max_chars = get_settings().max_description_chars
        if len(v) > max_chars:
            raise ValueError(f"description must be at most {max_chars} characters")
        return v

    @field_validator("incident_date", mode="before")
    @classmethod
    def _incident_date_iso(cls, v: Optional[str]) -> Optional[str]:
        v = _blank_to_none(v)
        if v is None:
            return None
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError as exc:
            raise ValueError("incident_date must be an ISO date (YYYY-MM-DD)") from exc
        return v

    @model_validator(mode="after")
    def _contact_rules(self) -> "IntakeSubmission":
        email = self.email
        phone = _blank_to_none(self.phone)
        if not email and not phone:
            raise ValueError("Provide at least an email or a phone number")
        if self.preferred_contact_method == "email" and not email:
            raise ValueError("Email is required when preferred_contact_method is 'email'")
        if self.preferred_contact_method == "phone" and not phone:
            raise ValueError("Phone is required when preferred_contact_method is 'phone'")
        return self


class IntakeAnalysis(BaseModel):
    """Structured analysis produced for an intake."""

    client_name: str
    case_type: CaseType
    incident_date: str = "unknown"
    injury_summary: str = ""
    liability_summary: str = ""
    urgency_level: UrgencyLevel
    statute_of_limitations_risk: StatuteRisk
    missing_information: list[str] = Field(default_factory=list)
    recommended_next_step: str = ""
    client_follow_up_email: str = ""
    internal_summary: str = ""
    analysis_summary: str = ""


class IntegrationStatus(BaseModel):
    local_saved: bool = False
    airtable_saved: bool = False
    slack_notified: bool = False


class IntakeResponse(BaseModel):
    intake_id: str
    status: str
    analysis: IntakeAnalysis
    integrations: IntegrationStatus


class SavedIntakeRecord(BaseModel):
    id: str
    created_at: str
    submission: IntakeSubmission
    analysis: IntakeAnalysis
    integrations: IntegrationStatus
