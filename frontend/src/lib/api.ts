// API client for the Legal Intake AI Agent.
//
// Two modes:
//   1. Connected   — when VITE_API_URL is set, calls the FastAPI backend
//                    (POST /api/intake, GET /api/intakes, GET /api/intakes/:id).
//   2. Demo/offline — when VITE_API_URL is unset, analyzes intakes locally with
//                    mockAnalyze() and persists records in localStorage so the UI
//                    is fully usable without a running backend.

import { mockAnalyze } from "./mock";
import type {
  IntakeResponse,
  IntakeSubmission,
  SavedIntakeRecord,
} from "./types";

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
const STORAGE_KEY = "legal_intake_records";

export const isDemoMode = API_BASE === "";

/** Raised for any API-level failure; carries a user-friendly message. */
export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

// ---------------------------------------------------------------------------
// Demo-mode persistence (localStorage)
// ---------------------------------------------------------------------------

function readLocal(): SavedIntakeRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedIntakeRecord[]) : [];
  } catch {
    // Malformed storage should never crash the UI.
    return [];
  }
}

function writeLocal(records: SavedIntakeRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Quota / private mode — non-fatal for a demo.
  }
}

function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Simulate network latency so loading states are visible in demo mode.
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function submitIntake(
  submission: IntakeSubmission,
): Promise<IntakeResponse> {
  if (isDemoMode) {
    await delay(700);
    const analysis = mockAnalyze(submission);
    const record: SavedIntakeRecord = {
      id: uuid(),
      created_at: new Date().toISOString(),
      submission,
      analysis,
      integrations: { local_saved: true, airtable_saved: false, slack_notified: false },
    };
    const records = readLocal();
    records.unshift(record);
    writeLocal(records);
    return {
      intake_id: record.id,
      status: "analyzed",
      analysis,
      integrations: record.integrations,
    };
  }

  const res = await fetchJson("/api/intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(submission),
  });
  return res as IntakeResponse;
}

export async function listIntakes(): Promise<SavedIntakeRecord[]> {
  if (isDemoMode) {
    await delay(200);
    return readLocal();
  }
  const res = await fetchJson("/api/intakes", { method: "GET" });
  return (Array.isArray(res) ? res : []) as SavedIntakeRecord[];
}

export async function getIntake(id: string): Promise<SavedIntakeRecord | null> {
  if (isDemoMode) {
    await delay(100);
    return readLocal().find((r) => r.id === id) ?? null;
  }
  const res = await fetchJson(`/api/intakes/${encodeURIComponent(id)}`, { method: "GET" });
  return res as SavedIntakeRecord;
}

async function fetchJson(path: string, init: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new ApiError("NETWORK", "Could not reach the server. Please try again.");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // Some endpoints (or errors) may not return JSON.
  }

  if (!res.ok) {
    const detail = (data as { detail?: { message?: string } | string })?.detail;
    const message =
      typeof detail === "string"
        ? detail
        : detail?.message ?? "The request failed. Please try again.";
    const code =
      typeof detail === "object" && detail && "code" in detail
        ? String((detail as { code?: string }).code)
        : `HTTP_${res.status}`;
    throw new ApiError(code, message);
  }

  return data;
}
