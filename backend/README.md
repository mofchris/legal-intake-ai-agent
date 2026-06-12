# Legal Intake AI Agent — Backend

FastAPI service that analyzes personal injury intake submissions with the OpenAI
API, stores them in SQLite, writes an audit log, and optionally notifies Slack /
Airtable. See the [root README](../README.md) and the
[specification](../docs/SPECIFICATION.md) for the full contract.

> Portfolio demo. Administrative screening only — not legal advice.

## Quick start

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate          # Windows
# source .venv/bin/activate     # macOS / Linux
pip install -r requirements.txt
cp .env.example .env            # then set OPENAI_API_KEY, or DEMO_MODE=true
uvicorn app.main:app --reload   # http://127.0.0.1:8000
```

- API docs (Swagger): http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

### Demo mode

Set `DEMO_MODE=true` (or simply leave `OPENAI_API_KEY` empty and let the
evaluation script enable it) to run without an API key. Intakes are analyzed by
the deterministic rules in `app/rules.py` instead of calling OpenAI.

## Tests

```bash
pytest
```

Tests run in demo mode against an isolated temp database and never call OpenAI
(the client is monkeypatched where the real path is exercised).

## Classification evaluation

```bash
python scripts/evaluate_cases.py
```

Runs the 30+ sample cases (`app/sample_cases.py`) through the analyzer and
reports case-type and urgency accuracy. Results are written to
`data/evaluation_results.json`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| POST | `/api/intake` | Analyze + save an intake |
| GET | `/api/intakes` | List saved intakes |
| GET | `/api/intakes/{intake_id}` | Fetch one intake (404 if missing) |

## Layout

```
app/
├── main.py            # FastAPI app, routes, CORS, error handling
├── config.py          # settings (env / .env)
├── models.py          # Pydantic request/response models
├── rules.py           # deterministic helpers + demo analyzer
├── prompts.py         # system prompt + schema hint
├── openai_client.py   # analyze_intake (OpenAI + demo fallback)
├── storage.py         # SQLite persistence
├── logger.py          # JSONL audit log + PII redaction
├── integrations.py    # Slack + Airtable (optional, fail-safe)
└── sample_cases.py    # 30+ labeled sample intakes
tests/                 # pytest suite
scripts/evaluate_cases.py
```

## Configuration

See `.env.example`. Key variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENAI_API_KEY` | — | OpenAI key (server-side only) |
| `OPENAI_MODEL` | `gpt-4.1-mini` | Model id |
| `DEMO_MODE` | `false` | Skip OpenAI, use deterministic analysis |
| `DATABASE_PATH` | `data/intake_records.sqlite3` | SQLite file |
| `AUDIT_LOG_PATH` | `logs/audit.jsonl` | Audit log file |
| `LOG_REDACT_PII` | `true` | Mask email/phone in the audit log |
| `MAX_DESCRIPTION_CHARS` | `10000` | Description length cap |
| `CORS_ORIGINS` | localhost dev ports | Allowed SPA origins |
| `SLACK_WEBHOOK_URL` | — | Optional Slack notifications |
| `AIRTABLE_API_KEY` / `AIRTABLE_BASE_ID` / `AIRTABLE_TABLE_NAME` | — | Optional Airtable sync |

## Connect the frontend

Run this API on `:8000`, then set `frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

The SPA will call the live endpoints instead of its built-in demo analyzer.

## Deploy to Render

A [`render.yaml`](../render.yaml) blueprint is included. One-click:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/mofchris/legal-intake-ai-agent)

Or: Render dashboard → **New → Blueprint** → select this repo. When prompted,
set **`OPENAI_API_KEY`** (the one secret; everything else has defaults). The
service builds from `backend/` and starts with
`uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

Notes:
- **Free tier** spins down after ~15 min idle; the first request then takes
  ~30–60s to wake (cold start).
- The free tier has **no persistent disk**, so the SQLite file resets on each
  deploy/restart. Fine for a demo; add a paid disk for durable storage.
- To run without a key, set `DEMO_MODE=true` in the Render dashboard instead of
  providing `OPENAI_API_KEY`.
- After deploy, the API root and Swagger docs live at `https://<service>.onrender.com/`
  and `/docs`.
