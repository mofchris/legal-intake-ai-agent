# Legal Intake AI Agent

AI-powered client intake automation for a personal injury law firm. A
prospective client submits an inquiry and the app classifies the matter,
extracts structured fields, flags urgency, screens statute-of-limitations risk,
lists what's missing, and drafts a follow-up email.

> Portfolio demo. It performs administrative intake screening only and does not
> provide legal advice. Use fake / demo data.

## Screenshots

| Landing | Analysis result |
|---------|-----------------|
| ![Landing page](docs/images/landing.png) | ![Intake analysis](docs/images/analysis.png) |

## Features

- **Case classification** into auto, rideshare, premises, catastrophic, wrongful
  death, or unclear — with a conservative precedence order.
- **Urgency scoring** from severity keywords (surgery, hospitalization,
  paralysis, fatalities, minors, government/commercial defendants, …).
- **Statute-of-limitations screening** from the incident date (administrative
  heuristic, not legal advice).
- **Missing-information detection** so follow-up is targeted.
- **Drafted client follow-up email**, disclaimer-safe, tailored to the matter.
- **Recent intakes** view of saved records.
- **Demo mode** — the frontend runs end-to-end with no backend or API key.

## Tech stack

**Frontend (this repo):**
- Vite + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui (Radix), Geist font
- React Router

**Backend (specified, not yet implemented):**
- Python 3.11+, FastAPI, Uvicorn
- OpenAI Python SDK (structured outputs)
- Pydantic, SQLite, JSONL audit logs
- Optional Slack webhook + Airtable

See [`docs/SPECIFICATION.md`](docs/SPECIFICATION.md) for the full contract.

## Architecture

```
Browser (React SPA)  ──HTTP/JSON──>  FastAPI backend  ──>  OpenAI API
       │                                   │
       │                                   ├──> SQLite (records)
       │                                   ├──> JSONL audit log
       │                                   ├──> Slack webhook (optional)
       │                                   └──> Airtable (optional)
```

The frontend runs in two modes:
- **Demo / offline** (default): intakes are analyzed by a deterministic local
  function and stored in `localStorage`. No backend or API key needed.
- **Connected**: set `VITE_API_URL` to the FastAPI base URL and the app calls
  the real endpoints.

## Repository layout

```
.
├── frontend/          # Vite + React SPA  (built)
├── docs/
│   ├── SPECIFICATION.md          # frontend/backend contract
│   ├── design-block-references.txt
│   ├── wireframes.html
│   └── images/
└── backend/           # FastAPI service  (planned — see SPECIFICATION.md)
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Other scripts:

```bash
npm run build        # type-check + production build to frontend/dist
npm run preview      # serve the production build
```

To point the UI at a running backend instead of demo mode, create
`frontend/.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Routes

| Path | Description |
|------|-------------|
| `/` | Marketing landing page |
| `/auth` | Sign in / sign up |
| `/app` | The intake tool (form, AI analysis, recent intakes) |

## Roadmap

- [x] Frontend SPA with demo-mode analyzer
- [ ] FastAPI backend per `docs/SPECIFICATION.md`
- [ ] OpenAI structured-output integration
- [ ] SQLite storage + JSONL audit logging
- [ ] Slack + Airtable integrations
- [ ] Test suite + classification evaluation script

## Safety

- AI calls stay server-side; the OpenAI key is never exposed to the browser.
- Client text is treated as untrusted narrative (prompt-injection defense).
- All user/AI text is rendered escaped (no `innerHTML`).
- Disclaimers throughout; the app is not a substitute for legal advice.

## License

MIT — see [LICENSE](LICENSE).
