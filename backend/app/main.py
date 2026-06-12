"""FastAPI application: intake analysis API for the Legal Intake AI Agent."""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app import storage
from app.config import get_settings
from app.integrations import save_to_airtable, send_slack_notification
from app.logger import log_intake
from app.models import (
    IntakeAnalysis,
    IntakeResponse,
    IntakeSubmission,
    IntegrationStatus,
    SavedIntakeRecord,
)
from app.openai_client import AIAnalysisError, analyze_intake
from app.storage import StorageError

@asynccontextmanager
async def lifespan(_app: FastAPI):
    storage.init_db()
    yield


app = FastAPI(
    title="Legal Intake AI Agent API",
    version="0.1.0",
    description="AI-powered personal injury intake analysis. Portfolio demo — not legal advice.",
    lifespan=lifespan,
)

_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root() -> dict:
    return {
        "service": "Legal Intake AI Agent API",
        "status": "ok",
        "demo_mode": get_settings().demo_mode,
        "docs": "/docs",
        "endpoints": ["/health", "/api/intake", "/api/intakes", "/api/intakes/{intake_id}"],
    }


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/api/intake", response_model=IntakeResponse)
def create_intake(submission: IntakeSubmission) -> IntakeResponse:
    intake_id = str(uuid.uuid4())
    request_payload = submission.model_dump(mode="json")

    # 1. Analyze (OpenAI or demo mode).
    try:
        analysis = analyze_intake(submission)
    except AIAnalysisError as exc:
        log_intake(intake_id=intake_id, request_payload=request_payload, error=exc.code)
        status = 503 if exc.code.startswith("CONFIG") else 502
        raise HTTPException(status_code=status, detail={"code": exc.code, "message": exc.message})

    # 2. Optional integrations (best-effort; never block the save/response).
    slack_notified = send_slack_notification(submission, analysis, intake_id)
    airtable_saved = save_to_airtable(submission, analysis, intake_id)

    # 3. Persist locally.
    integrations = IntegrationStatus(
        local_saved=True, airtable_saved=airtable_saved, slack_notified=slack_notified
    )
    try:
        record = storage.save_record(submission, analysis, integrations, record_id=intake_id)
    except StorageError as exc:
        log_intake(
            intake_id=intake_id,
            request_payload=request_payload,
            analysis_output=analysis.model_dump(),
            error=f"STORAGE_ERROR: {exc}",
        )
        raise HTTPException(
            status_code=500,
            detail={"code": "STORAGE_ERROR", "message": "The intake was analyzed but could not be saved."},
        )

    # 4. Audit log.
    log_intake(
        intake_id=record.id,
        request_payload=request_payload,
        analysis_output=analysis.model_dump(),
        local_saved=True,
        airtable_saved=airtable_saved,
        slack_notified=slack_notified,
    )

    return IntakeResponse(
        intake_id=record.id,
        status="analyzed",
        analysis=analysis,
        integrations=record.integrations,
    )


@app.get("/api/intakes", response_model=list[SavedIntakeRecord])
def list_intakes() -> list[SavedIntakeRecord]:
    try:
        return storage.list_records()
    except StorageError:
        raise HTTPException(
            status_code=500,
            detail={"code": "STORAGE_ERROR", "message": "Could not read intake records."},
        )


@app.get("/api/intakes/{intake_id}", response_model=SavedIntakeRecord)
def get_intake(intake_id: str) -> SavedIntakeRecord:
    try:
        record = storage.get_record(intake_id)
    except StorageError:
        raise HTTPException(
            status_code=500,
            detail={"code": "STORAGE_ERROR", "message": "Could not read the intake record."},
        )
    if record is None:
        raise HTTPException(status_code=404, detail="Intake record not found")
    return record
