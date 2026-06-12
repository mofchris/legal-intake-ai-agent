import type React from "react";
import { ResultCard } from "@/components/result-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CONTACT_METHOD_LABELS } from "@/lib/types";
import type { SavedIntakeRecord } from "@/lib/types";

/** Full detail of one claim: the AI analysis plus the original submission. */
export function ClaimDetail({ record }: { record: SavedIntakeRecord }) {
  const s = record.submission;
  return (
    <div className="space-y-6">
      <ResultCard
        response={{
          intake_id: record.id,
          status: "analyzed",
          analysis: record.analysis,
          integrations: record.integrations,
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Original submission</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          <Field label="Name">{s.client_name}</Field>
          <Field label="Preferred contact">{CONTACT_METHOD_LABELS[s.preferred_contact_method]}</Field>
          <Field label="Email">{s.email ?? "—"}</Field>
          <Field label="Phone">{s.phone ?? "—"}</Field>
          <Field label="Incident date">{s.incident_date ?? "—"}</Field>
          <Field label="Injury type">{s.injury_type ?? "—"}</Field>
          <Field label="Submitted">{new Date(record.created_at).toLocaleString()}</Field>
          <div className="sm:col-span-2">
            <Field label="Description">{s.description}</Field>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="break-words">{children}</p>
    </div>
  );
}
