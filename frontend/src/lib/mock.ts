// Deterministic, offline "AI" analyzer.
//
// When no backend is connected (VITE_API_URL unset) the app runs in demo mode
// and uses this function instead of the OpenAI-powered FastAPI endpoint. It
// mirrors the deterministic helper rules described in the build plan
// (app/rules.py) so reviewers can try the UI end-to-end without an API key.

import type {
  CaseType,
  IntakeAnalysis,
  IntakeSubmission,
  StatuteRisk,
  UrgencyLevel,
} from "./types";
import { CASE_TYPE_LABELS } from "./types";

const HIGH_URGENCY_KEYWORDS = [
  "death",
  "died",
  "fatal",
  "killed",
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
];

// Classification keyword sets, evaluated in precedence order (most severe first).
const CASE_RULES: { type: CaseType; keywords: string[] }[] = [
  { type: "wrongful_death", keywords: ["death", "died", "passed away", "fatal", "killed", "deceased"] },
  {
    type: "catastrophic_injury",
    keywords: ["paralysis", "paralyzed", "spinal cord", "brain injury", "tbi", "amputation", "quadriplegic", "paraplegic"],
  },
  { type: "rideshare_accident", keywords: ["uber", "lyft", "rideshare", "ride share"] },
  { type: "auto_accident", keywords: ["car", "vehicle", "rear-ended", "rear ended", "collision", "crash", "truck", "driver", "intersection", "red light"] },
  { type: "premises_liability", keywords: ["slip", "fell", "trip", "wet floor", "store", "property", "premises", "staircase", "sidewalk"] },
];

function containsAny(haystack: string, needles: string[]): string[] {
  return needles.filter((n) => haystack.includes(n));
}

function classify(text: string): CaseType {
  for (const rule of CASE_RULES) {
    if (containsAny(text, rule.keywords).length > 0) {
      return rule.type;
    }
  }
  return "other_unclear";
}

function monthsSince(dateStr?: string): number | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
}

function isFutureDate(dateStr?: string): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getTime() > Date.now();
}

/** Administrative statute-of-limitations screening heuristic (NOT legal advice). */
function statuteRisk(dateStr: string | undefined, months: number | null): StatuteRisk {
  if (isFutureDate(dateStr)) return "unknown";
  if (months === null) return "unknown";
  if (months >= 24) return "high";
  if (months >= 18) return "medium";
  return "low";
}

function urgency(matchedKeywords: string[], risk: StatuteRisk): UrgencyLevel {
  if (matchedKeywords.length > 0 || risk === "high") return "high";
  if (risk === "medium") return "medium";
  return "low";
}

/**
 * Produce a deterministic IntakeAnalysis from a submission. Pure function — the
 * same input always yields the same output, which keeps the demo predictable.
 */
export function mockAnalyze(submission: IntakeSubmission): IntakeAnalysis {
  const text = `${submission.injury_type ?? ""} ${submission.description}`.toLowerCase();

  const caseType = classify(text);
  const matchedKeywords = containsAny(text, HIGH_URGENCY_KEYWORDS);
  const months = monthsSince(submission.incident_date);
  const risk = statuteRisk(submission.incident_date, months);
  const urgencyLevel = urgency(matchedKeywords, risk);

  const missing: string[] = [];
  if (!submission.incident_date) missing.push("Incident date not provided");
  else if (isFutureDate(submission.incident_date)) missing.push("Incident date is in the future — confirm correct date");
  if (!submission.email && !submission.phone) missing.push("No contact method on file");
  if (!submission.injury_type) missing.push("Injury type not specified");
  if (caseType === "other_unclear") missing.push("Incident type could not be determined from the description");

  const incidentDate = submission.incident_date && !isFutureDate(submission.incident_date)
    ? submission.incident_date
    : "unknown";

  const caseLabel = CASE_TYPE_LABELS[caseType];

  const injurySummary = submission.injury_type
    ? `Reported ${submission.injury_type.toLowerCase()}.`
    : "Injury details were not clearly specified in the submission.";

  const reasonBits: string[] = [`Classified as ${caseLabel} based on the incident description.`];
  if (matchedKeywords.length > 0) {
    reasonBits.push(`Urgency raised to ${urgencyLevel} due to high-severity indicators (${matchedKeywords.slice(0, 3).join(", ")}).`);
  } else if (risk !== "low" && risk !== "unknown") {
    reasonBits.push(`Urgency reflects an aging incident date (statute-of-limitations screening: ${risk}).`);
  }

  return {
    client_name: submission.client_name,
    case_type: caseType,
    incident_date: incidentDate,
    injury_summary: injurySummary,
    liability_summary:
      "Liability not yet assessed. A human reviewer should evaluate fault, available evidence, and potential defendants.",
    urgency_level: urgencyLevel,
    statute_of_limitations_risk: risk,
    missing_information: missing,
    recommended_next_step:
      urgencyLevel === "high"
        ? "Route to an attorney for prompt human review."
        : "Schedule a follow-up call to gather remaining details.",
    client_follow_up_email: buildFollowUpEmail(submission, caseLabel),
    internal_summary: `${caseLabel} intake for ${submission.client_name}. Urgency: ${urgencyLevel}. SOL risk: ${risk}.`,
    analysis_summary: reasonBits.join(" "),
  };
}

function buildFollowUpEmail(submission: IntakeSubmission, caseLabel: string): string {
  const first = submission.client_name.trim().split(/\s+/)[0] || "there";
  return [
    `Dear ${first},`,
    "",
    `Thank you for reaching out to our firm regarding your ${caseLabel.toLowerCase()} matter. We have received your intake and a member of our team will review the details you provided.`,
    "",
    "To help us move forward, please reply with any photographs, police or incident reports, and the names of any medical providers you have seen.",
    "",
    "This message is for administrative intake purposes only and does not create an attorney-client relationship or constitute legal advice.",
    "",
    "Warm regards,",
    "Client Intake Team",
  ].join("\n");
}
