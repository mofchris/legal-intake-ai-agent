# Specification — Legal Intake AI Agent

This document defines what the application does and the contract between the
frontend and the backend. It is the source of truth for both halves of the
monorepo.

## Goal

A working legal intake automation demo for a personal injury law firm. A
prospective client submits an inquiry; the system classifies the matter,
extracts structured fields, flags urgency, screens for statute-of-limitations
risk, lists missing information, and drafts a follow-up email.

This is a portfolio project. Clarity, reliability, and documentation are
prioritized over unnecessary complexity.

## Architecture

```
Browser (React SPA)  ──HTTP/JSON──>  FastAPI backend  ──>  OpenAI API
       │                                   │
       │                                   ├──> SQLite (records)
       │                                   ├──> JSONL audit log
       │                                   ├──> Slack webhook (optional)
       │                                   └──> Airtable (optional)
```

The frontend is a Vite + React + TypeScript single-page app styled with
Tailwind and shadcn/ui. It runs in one of two modes:

- **Connected** — `VITE_API_URL` points at the FastAPI backend.
- **Demo / offline** — `VITE_API_URL` is unset; the app analyzes intakes with a
  deterministic local function and persists records in `localStorage`, so the UI
  is fully usable without a backend or API key.

The backend is specified below and is not yet implemented in this repository.

## Domain enums

| Field | Allowed values |
|-------|----------------|
| `case_type` | `auto_accident`, `rideshare_accident`, `premises_liability`, `catastrophic_injury`, `wrongful_death`, `other_unclear` |
| `urgency_level` | `low`, `medium`, `high` |
| `statute_of_limitations_risk` | `low`, `medium`, `high`, `unknown` |
| `preferred_contact_method` | `email`, `phone`, `either` |

Case classification precedence (when several categories could apply, the higher
one wins): `wrongful_death` → `catastrophic_injury` → `rideshare_accident` →
`auto_accident` → `premises_liability` → `other_unclear`.

## API contract

### `GET /health`
```json
{ "status": "ok" }
```

### `POST /api/intake`

Request:
```json
{
  "client_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "555-555-5555",
  "incident_date": "2024-03-15",
  "injury_type": "Neck and back injury",
  "description": "I was rear-ended at a red light and now have pain.",
  "preferred_contact_method": "email"
}
```

Response:
```json
{
  "intake_id": "uuid",
  "status": "analyzed",
  "analysis": {
    "client_name": "Jane Doe",
    "case_type": "auto_accident",
    "incident_date": "2024-03-15",
    "injury_summary": "...",
    "liability_summary": "...",
    "urgency_level": "medium",
    "statute_of_limitations_risk": "low",
    "missing_information": ["..."],
    "recommended_next_step": "...",
    "client_follow_up_email": "...",
    "internal_summary": "...",
    "analysis_summary": "..."
  },
  "integrations": {
    "local_saved": true,
    "airtable_saved": false,
    "slack_notified": false
  }
}
```

### `GET /api/intakes`
Returns a list of saved records (empty list when there are none).

### `GET /api/intakes/{intake_id}`
Returns one record, or a clean `404`:
```json
{ "detail": "Intake record not found" }
```

Errors return clean JSON, never stack traces:
```json
{ "detail": { "code": "AI_ANALYSIS_FAILED", "message": "The intake could not be analyzed. Please try again." } }
```

## Validation rules

- `client_name` required, non-blank after trimming.
- At least one of `email` / `phone` must be present; `email` must be a valid
  address when provided.
- `preferred_contact_method = email` requires an email; `= phone` requires a phone.
- `description` required and capped at `MAX_DESCRIPTION_CHARS` (default 10,000).
- `incident_date`, when given, must be ISO `YYYY-MM-DD`; ambiguous or future
  dates are rejected or treated as unknown.

## Statute-of-limitations screening (administrative heuristic, not legal advice)

- Missing / unparseable incident date → `unknown`.
- Future incident date → `unknown` (or validation error).
- Older than 18 months → at least `medium`.
- Older than 24 months → `high`.

High urgency is also triggered by severity indicators: death, brain injury, TBI,
paralysis, spinal cord, surgery, hospitalization, ambulance, minor child,
government vehicle, commercial truck / defendant, and similar.

## Safety requirements

- The OpenAI key lives only on the server and is never exposed to the browser.
- Client-submitted text is untrusted narrative — never treated as instructions
  to the model (prompt-injection defense).
- User and AI text is rendered with `textContent` semantics (React escapes by
  default; no `innerHTML`).
- Audit logs never contain API keys and mask email/phone when configured.
- Disclaimers throughout: this is administrative screening, not legal advice.
- The UI asks users to enter demo/fake data only.

## Implementation status

- [x] Frontend SPA (landing, auth, intake app) with demo-mode analyzer.
- [ ] FastAPI backend implementing the contract above.
- [ ] OpenAI integration with structured outputs.
- [ ] SQLite storage, audit logging, Slack/Airtable integrations.
- [ ] Test suite and evaluation script.
