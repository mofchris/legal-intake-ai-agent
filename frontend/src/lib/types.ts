// Shared domain types for the Legal Intake AI Agent.
// These mirror the Pydantic models / JSON schema described in the build plan
// (claude_code_legal_intake_app_plan.md) so the frontend and FastAPI backend
// agree on the contract.

export const CASE_TYPES = [
  "auto_accident",
  "rideshare_accident",
  "premises_liability",
  "catastrophic_injury",
  "wrongful_death",
  "other_unclear",
] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export const URGENCY_LEVELS = ["low", "medium", "high"] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number];

export const STATUTE_RISKS = ["low", "medium", "high", "unknown"] as const;
export type StatuteRisk = (typeof STATUTE_RISKS)[number];

export const CONTACT_METHODS = ["email", "phone", "either"] as const;
export type ContactMethod = (typeof CONTACT_METHODS)[number];

/** What the intake form submits to the backend. */
export interface IntakeSubmission {
  client_name: string;
  email?: string;
  phone?: string;
  /** ISO date, YYYY-MM-DD. Optional / may be unknown. */
  incident_date?: string;
  injury_type?: string;
  description: string;
  preferred_contact_method: ContactMethod;
}

/** Structured AI analysis returned for an intake. */
export interface IntakeAnalysis {
  client_name: string;
  case_type: CaseType;
  /** ISO date or the literal string "unknown". */
  incident_date: string;
  injury_summary: string;
  liability_summary: string;
  urgency_level: UrgencyLevel;
  statute_of_limitations_risk: StatuteRisk;
  missing_information: string[];
  recommended_next_step: string;
  client_follow_up_email: string;
  internal_summary: string;
  /** Business-friendly explanation of the classification (not chain-of-thought). */
  analysis_summary: string;
}

export interface IntegrationStatus {
  local_saved: boolean;
  airtable_saved: boolean;
  slack_notified: boolean;
}

/** Response from POST /api/intake. */
export interface IntakeResponse {
  intake_id: string;
  status: string;
  analysis: IntakeAnalysis;
  integrations: IntegrationStatus;
}

/** A persisted record as returned by GET /api/intakes. */
export interface SavedIntakeRecord {
  id: string;
  created_at: string;
  submission: IntakeSubmission;
  analysis: IntakeAnalysis;
  integrations: IntegrationStatus;
}

// Human-readable labels for enum values.

export const CASE_TYPE_LABELS: Record<CaseType, string> = {
  auto_accident: "Auto Accident",
  rideshare_accident: "Rideshare Accident",
  premises_liability: "Premises Liability",
  catastrophic_injury: "Catastrophic Injury",
  wrongful_death: "Wrongful Death",
  other_unclear: "Other / Unclear",
};

export const CONTACT_METHOD_LABELS: Record<ContactMethod, string> = {
  email: "Email",
  phone: "Phone",
  either: "Either",
};
