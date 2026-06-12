"""Optional Slack and Airtable integrations.

Both are best-effort: when not configured or on any error they return ``False``
without raising, so a failure never blocks the local save or the API response.
"""

from __future__ import annotations

import requests

from app.config import get_settings
from app.models import IntakeAnalysis, IntakeSubmission

NETWORK_TIMEOUT = 5  # seconds


def send_slack_notification(
    submission: IntakeSubmission, analysis: IntakeAnalysis, intake_id: str
) -> bool:
    settings = get_settings()
    if not settings.slack_webhook_url:
        return False

    text = (
        "New Legal Intake Submitted\n\n"
        f"Client: {submission.client_name}\n"
        f"Case Type: {analysis.case_type}\n"
        f"Urgency: {analysis.urgency_level}\n"
        f"Incident Date: {analysis.incident_date}\n"
        f"Summary: {analysis.internal_summary}\n"
        f"Recommended Next Step: {analysis.recommended_next_step}\n"
        f"Intake ID: {intake_id}"
    )
    try:
        resp = requests.post(
            settings.slack_webhook_url,
            json={"text": text},
            timeout=NETWORK_TIMEOUT,
        )
        return 200 <= resp.status_code < 300
    except requests.RequestException:
        return False


def save_to_airtable(
    submission: IntakeSubmission, analysis: IntakeAnalysis, intake_id: str
) -> bool:
    settings = get_settings()
    if not settings.airtable_configured:
        return False

    url = f"https://api.airtable.com/v0/{settings.airtable_base_id}/{requests.utils.quote(settings.airtable_table_name)}"
    headers = {
        "Authorization": f"Bearer {settings.airtable_api_key}",
        "Content-Type": "application/json",
    }
    fields = {
        "Intake ID": intake_id,
        "Client Name": submission.client_name,
        "Email": str(submission.email) if submission.email else "",
        "Phone": submission.phone or "",
        "Case Type": analysis.case_type,
        "Urgency": analysis.urgency_level,
        "Statute Risk": analysis.statute_of_limitations_risk,
        "Incident Date": analysis.incident_date,
        "Internal Summary": analysis.internal_summary,
        "Recommended Next Step": analysis.recommended_next_step,
    }
    try:
        resp = requests.post(
            url,
            headers=headers,
            json={"fields": fields, "typecast": True},
            timeout=NETWORK_TIMEOUT,
        )
        return 200 <= resp.status_code < 300
    except requests.RequestException:
        return False
