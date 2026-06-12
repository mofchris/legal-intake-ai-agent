"""Deterministic helper rules that supplement the AI output.

These make the demo reliable and testable. They never replace the model when it
is used; they post-process its output and provide the full analysis in
``DEMO_MODE``. All date/statute logic here is an administrative screening
heuristic for portfolio demonstration only — it is not legal advice.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from app.models import CaseType, IntakeAnalysis, IntakeSubmission, StatuteRisk, UrgencyLevel

# Thresholds (months) for the statute-of-limitations screening heuristic.
SOL_MEDIUM_MONTHS = 18
SOL_HIGH_MONTHS = 24

HIGH_URGENCY_KEYWORDS = (
    "death",
    "died",
    "fatal",
    "killed",
    "deceased",
    "brain injury",
    "tbi",
    "paralysis",
    "paralyzed",
    "spinal cord",
    "surgery",
    "hospitalized",
    "hospital",
    "ambulance",
    "icu",
    "minor child",
    "my son",
    "my daughter",
    "my child",
    "government vehicle",
    "city bus",
    "police car",
    "commercial truck",
    "semi truck",
    "18-wheeler",
    "commercial defendant",
)

# Case classification keyword sets, in precedence order (most severe first).
_CASE_RULES: tuple[tuple[CaseType, tuple[str, ...]], ...] = (
    ("wrongful_death", ("death", "died", "passed away", "fatal", "killed", "deceased")),
    (
        "catastrophic_injury",
        ("paralysis", "paralyzed", "spinal cord", "brain injury", "tbi", "amputation", "quadriplegic", "paraplegic"),
    ),
    ("rideshare_accident", ("uber", "lyft", "rideshare", "ride share")),
    (
        "auto_accident",
        ("car", "vehicle", "rear-ended", "rear ended", "collision", "crash", "truck", "driver", "intersection", "red light"),
    ),
    ("premises_liability", ("slip", "fell", "trip", "wet floor", "store", "property", "premises", "staircase", "sidewalk")),
)


def normalize_blank(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None


def parse_incident_date(value: Optional[str]) -> Optional[date]:
    value = normalize_blank(value)
    if not value:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        return None


def is_future_date(d: Optional[date], *, today: Optional[date] = None) -> bool:
    if d is None:
        return False
    today = today or date.today()
    return d > today


def months_since(d: Optional[date], *, today: Optional[date] = None) -> Optional[int]:
    if d is None:
        return None
    today = today or date.today()
    return (today.year - d.year) * 12 + (today.month - d.month)


def statute_risk_for_date(value: Optional[str], *, today: Optional[date] = None) -> StatuteRisk:
    d = parse_incident_date(value)
    if d is None or is_future_date(d, today=today):
        return "unknown"
    months = months_since(d, today=today)
    if months is None:
        return "unknown"
    if months >= SOL_HIGH_MONTHS:
        return "high"
    if months >= SOL_MEDIUM_MONTHS:
        return "medium"
    return "low"


def detect_high_urgency_keywords(text: str) -> list[str]:
    lowered = text.lower()
    return [kw for kw in HIGH_URGENCY_KEYWORDS if kw in lowered]


def classify_case(text: str) -> CaseType:
    lowered = text.lower()
    for case_type, keywords in _CASE_RULES:
        if any(kw in lowered for kw in keywords):
            return case_type
    return "other_unclear"


_URGENCY_ORDER = {"low": 0, "medium": 1, "high": 2}


def _max_urgency(a: UrgencyLevel, b: UrgencyLevel) -> UrgencyLevel:
    return a if _URGENCY_ORDER[a] >= _URGENCY_ORDER[b] else b


# Case types that are inherently high urgency regardless of other signals.
ALWAYS_HIGH_URGENCY_CASES: tuple[CaseType, ...] = ("wrongful_death", "catastrophic_injury")


def combine_urgency(keywords: list[str], risk: StatuteRisk, case_type: Optional[CaseType] = None) -> UrgencyLevel:
    if case_type in ALWAYS_HIGH_URGENCY_CASES:
        return "high"
    if keywords or risk == "high":
        return "high"
    if risk == "medium":
        return "medium"
    return "low"


def default_missing_information(submission: IntakeSubmission, case_type: CaseType) -> list[str]:
    missing: list[str] = []
    d = parse_incident_date(submission.incident_date)
    if d is None:
        missing.append("Incident date not provided")
    elif is_future_date(d):
        missing.append("Incident date is in the future — confirm correct date")
    if not submission.email and not normalize_blank(submission.phone):
        missing.append("No contact method on file")
    if not normalize_blank(submission.injury_type):
        missing.append("Injury type not specified")
    if case_type == "other_unclear":
        missing.append("Incident type could not be determined from the description")
    return missing


def _follow_up_email(submission: IntakeSubmission, case_label: str) -> str:
    first = submission.client_name.strip().split()[0] if submission.client_name.strip() else "there"
    return "\n".join(
        [
            f"Dear {first},",
            "",
            f"Thank you for reaching out to our firm regarding your {case_label} matter. We have received "
            "your intake and a member of our team will review the details you provided.",
            "",
            "To help us move forward, please reply with any photographs, police or incident reports, and the "
            "names of any medical providers you have seen.",
            "",
            "This message is for administrative intake purposes only and does not create an attorney-client "
            "relationship or constitute legal advice.",
            "",
            "Warm regards,",
            "Client Intake Team",
        ]
    )


_CASE_LABELS = {
    "auto_accident": "auto accident",
    "rideshare_accident": "rideshare accident",
    "premises_liability": "premises liability",
    "catastrophic_injury": "catastrophic injury",
    "wrongful_death": "wrongful death",
    "other_unclear": "personal injury",
}


def build_demo_analysis(submission: IntakeSubmission, *, today: Optional[date] = None) -> IntakeAnalysis:
    """Deterministic analysis used in DEMO_MODE (mirrors the frontend demo)."""
    text = f"{submission.injury_type or ''} {submission.description}"
    case_type = classify_case(text)
    keywords = detect_high_urgency_keywords(text)
    risk = statute_risk_for_date(submission.incident_date, today=today)
    urgency = combine_urgency(keywords, risk, case_type)

    d = parse_incident_date(submission.incident_date)
    incident_date = submission.incident_date if (d is not None and not is_future_date(d, today=today)) else "unknown"

    case_label = _CASE_LABELS[case_type]
    injury_summary = (
        f"Reported {submission.injury_type.strip().lower()}."
        if normalize_blank(submission.injury_type)
        else "Injury details were not clearly specified in the submission."
    )

    reason = [f"Classified as {case_label} based on the incident description."]
    if keywords:
        reason.append(
            f"Urgency raised to {urgency} due to high-severity indicators ({', '.join(keywords[:3])})."
        )
    elif risk in ("medium", "high"):
        reason.append(f"Urgency reflects an aging incident date (statute screening: {risk}).")

    return IntakeAnalysis(
        client_name=submission.client_name,
        case_type=case_type,
        incident_date=incident_date,
        injury_summary=injury_summary,
        liability_summary=(
            "Liability not yet assessed. A human reviewer should evaluate fault, available evidence, and "
            "potential defendants."
        ),
        urgency_level=urgency,
        statute_of_limitations_risk=risk,
        missing_information=default_missing_information(submission, case_type),
        recommended_next_step=(
            "Route to an attorney for prompt human review."
            if urgency == "high"
            else "Schedule a follow-up call to gather remaining details."
        ),
        client_follow_up_email=_follow_up_email(submission, case_label),
        internal_summary=f"{case_label.title()} intake for {submission.client_name}. Urgency: {urgency}. SOL risk: {risk}.",
        analysis_summary=" ".join(reason),
    )


def post_process(analysis: IntakeAnalysis, submission: IntakeSubmission, *, today: Optional[date] = None) -> IntakeAnalysis:
    """Apply deterministic safety rules on top of an AI-produced analysis.

    Raises urgency/statute risk based on the incident date and severity keywords,
    and ensures safe-default missing-information items are present.
    """
    text = f"{submission.injury_type or ''} {submission.description}"
    keywords = detect_high_urgency_keywords(text)
    date_risk = statute_risk_for_date(submission.incident_date, today=today)

    # Statute risk: never weaker than the date-based screening says.
    risk = analysis.statute_of_limitations_risk
    if date_risk == "high":
        risk = "high"
    elif date_risk == "medium" and risk in ("low",):
        risk = "medium"
    elif parse_incident_date(submission.incident_date) is None and risk != "unknown":
        # Missing/unparseable date should screen as unknown.
        risk = "unknown" if date_risk == "unknown" else risk

    # Urgency: never lower than keyword/date/case-type evidence implies.
    urgency = analysis.urgency_level
    if analysis.case_type in ALWAYS_HIGH_URGENCY_CASES or keywords or risk == "high":
        urgency = "high"
    elif risk == "medium":
        urgency = _max_urgency(urgency, "medium")

    # Merge safe-default missing-info items without duplicates.
    merged_missing = list(dict.fromkeys([*analysis.missing_information, *default_missing_information(submission, analysis.case_type)]))

    return analysis.model_copy(
        update={
            "statute_of_limitations_risk": risk,
            "urgency_level": urgency,
            "missing_information": merged_missing,
        }
    )
