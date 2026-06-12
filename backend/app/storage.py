"""SQLite persistence for intake records."""

from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Optional

from app.config import get_settings
from app.models import (
    IntakeAnalysis,
    IntakeSubmission,
    IntegrationStatus,
    SavedIntakeRecord,
)


class StorageError(Exception):
    """Raised when a record cannot be persisted or read."""


_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS intake_records (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    client_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    incident_date TEXT,
    injury_type TEXT,
    description TEXT NOT NULL,
    preferred_contact_method TEXT NOT NULL,
    case_type TEXT,
    urgency_level TEXT,
    statute_of_limitations_risk TEXT,
    submission_json TEXT NOT NULL,
    analysis_json TEXT NOT NULL,
    integrations_json TEXT NOT NULL
)
"""


def _connect() -> sqlite3.Connection:
    settings = get_settings()
    db_path = settings.database_file
    try:
        db_path.parent.mkdir(parents=True, exist_ok=True)
        conn = sqlite3.connect(str(db_path), check_same_thread=False, timeout=10)
        conn.row_factory = sqlite3.Row
        return conn
    except (OSError, sqlite3.Error) as exc:
        raise StorageError(f"Could not open the database: {exc}") from exc


def init_db() -> None:
    conn = _connect()
    try:
        conn.execute(_CREATE_TABLE)
        conn.commit()
    except sqlite3.Error as exc:
        raise StorageError(f"Could not initialize the database: {exc}") from exc
    finally:
        conn.close()


def save_record(
    submission: IntakeSubmission,
    analysis: IntakeAnalysis,
    integrations: IntegrationStatus,
    record_id: Optional[str] = None,
) -> SavedIntakeRecord:
    record = SavedIntakeRecord(
        id=record_id or str(uuid.uuid4()),
        created_at=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        submission=submission,
        analysis=analysis,
        integrations=integrations,
    )
    conn = _connect()
    try:
        conn.execute(
            """
            INSERT INTO intake_records (
                id, created_at, client_name, email, phone, incident_date, injury_type,
                description, preferred_contact_method, case_type, urgency_level,
                statute_of_limitations_risk, submission_json, analysis_json, integrations_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                record.id,
                record.created_at,
                submission.client_name,
                str(submission.email) if submission.email else None,
                submission.phone,
                submission.incident_date,
                submission.injury_type,
                submission.description,
                submission.preferred_contact_method,
                analysis.case_type,
                analysis.urgency_level,
                analysis.statute_of_limitations_risk,
                submission.model_dump_json(),
                analysis.model_dump_json(),
                integrations.model_dump_json(),
            ),
        )
        conn.commit()
    except sqlite3.Error as exc:
        raise StorageError(f"Could not save the intake record: {exc}") from exc
    finally:
        conn.close()
    return record


def list_records() -> list[SavedIntakeRecord]:
    conn = _connect()
    try:
        rows = conn.execute(
            "SELECT * FROM intake_records ORDER BY created_at DESC"
        ).fetchall()
    except sqlite3.Error as exc:
        raise StorageError(f"Could not read intake records: {exc}") from exc
    finally:
        conn.close()
    return [r for r in (_row_to_record(row) for row in rows) if r is not None]


def get_record(intake_id: str) -> Optional[SavedIntakeRecord]:
    conn = _connect()
    try:
        row = conn.execute(
            "SELECT * FROM intake_records WHERE id = ?", (intake_id,)
        ).fetchone()
    except sqlite3.Error as exc:
        raise StorageError(f"Could not read the intake record: {exc}") from exc
    finally:
        conn.close()
    return _row_to_record(row) if row else None


def _row_to_record(row: sqlite3.Row) -> Optional[SavedIntakeRecord]:
    """Rebuild a record from a row, tolerating malformed stored JSON."""
    try:
        submission = IntakeSubmission.model_validate_json(row["submission_json"])
    except Exception:  # noqa: BLE001 - fall back to column values
        submission = _submission_from_columns(row)
        if submission is None:
            return None

    try:
        analysis = IntakeAnalysis.model_validate_json(row["analysis_json"])
    except Exception:  # noqa: BLE001 - malformed analysis JSON, build a minimal stub
        analysis = _fallback_analysis(row)

    try:
        integrations = IntegrationStatus.model_validate_json(row["integrations_json"])
    except Exception:  # noqa: BLE001
        integrations = IntegrationStatus(local_saved=True)

    return SavedIntakeRecord(
        id=row["id"],
        created_at=row["created_at"],
        submission=submission,
        analysis=analysis,
        integrations=integrations,
    )


def _submission_from_columns(row: sqlite3.Row) -> Optional[IntakeSubmission]:
    try:
        return IntakeSubmission(
            client_name=row["client_name"],
            email=row["email"],
            phone=row["phone"],
            incident_date=row["incident_date"],
            injury_type=row["injury_type"],
            description=row["description"],
            preferred_contact_method=row["preferred_contact_method"],
        )
    except Exception:  # noqa: BLE001
        return None


def _fallback_analysis(row: sqlite3.Row) -> IntakeAnalysis:
    return IntakeAnalysis(
        client_name=row["client_name"],
        case_type=row["case_type"] or "other_unclear",
        incident_date=row["incident_date"] or "unknown",
        urgency_level=row["urgency_level"] or "medium",
        statute_of_limitations_risk=row["statute_of_limitations_risk"] or "unknown",
        internal_summary="Stored analysis was unavailable.",
    )
