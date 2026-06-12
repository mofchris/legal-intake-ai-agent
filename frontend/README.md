# Legal Intake AI Agent — Frontend

Vite + React + TypeScript SPA for the Legal Intake AI Agent. Styled with
Tailwind CSS v4 and shadcn/ui. See the [root README](../README.md) for the full
project overview and the [specification](../docs/SPECIFICATION.md) for the API
contract.

## Develop

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check (tsc -b) + production build
npm run preview      # serve the production build
npm run lint         # eslint
```

## Demo mode vs connected

By default the app runs in **demo mode**: intakes are analyzed by a deterministic
local function (`src/lib/mock.ts`) and persisted in `localStorage`. No backend or
API key required.

To call a real backend, set `VITE_API_URL` (see `.env.example`):

```env
VITE_API_URL=http://localhost:8000
```

When set, the API client (`src/lib/api.ts`) calls `POST /api/intake`,
`GET /api/intakes`, and `GET /api/intakes/:id` instead of the local analyzer.

## Structure

```
src/
├── App.tsx                 # router (/, /auth, /app)
├── pages/
│   ├── landing-page.tsx
│   └── intake-app-page.tsx
├── components/
│   ├── intake-form.tsx     # the intake form + client-side validation
│   ├── result-card.tsx     # structured AI analysis display
│   ├── recent-intakes.tsx  # saved-records list
│   ├── auth-page.tsx
│   ├── hero.tsx / header.tsx / cta.tsx / footer.tsx / features-section.tsx
│   └── ui/                 # shadcn/ui primitives
└── lib/
    ├── types.ts            # shared domain types / enums (match the backend)
    ├── api.ts              # API client (connected or demo mode)
    └── mock.ts             # deterministic offline analyzer
```

## UI building blocks

Landing/auth/footer/cta layouts are based on shadcn registry blocks
(`@efferd` hero-2, auth-5, footer-3, cta-3), rebranded for this project. The
registry is configured in `components.json`.
