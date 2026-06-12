import type React from "react";
import { useState } from "react";
import { Loader2, AlertCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ApiError, submitIntake } from "@/lib/api";
import { CONTACT_METHODS, CONTACT_METHOD_LABELS } from "@/lib/types";
import type { ContactMethod, IntakeResponse, IntakeSubmission } from "@/lib/types";

const MAX_DESCRIPTION_CHARS = 10000;

interface IntakeFormProps {
  onResult: (response: IntakeResponse) => void;
}

interface FormState {
  client_name: string;
  email: string;
  phone: string;
  incident_date: string;
  injury_type: string;
  description: string;
  preferred_contact_method: ContactMethod;
}

const EMPTY: FormState = {
  client_name: "",
  email: "",
  phone: "",
  incident_date: "",
  injury_type: "",
  description: "",
  preferred_contact_method: "either",
};

function clientSideError(form: FormState): string | null {
  if (!form.client_name.trim()) return "Client name is required.";
  if (!form.email.trim() && !form.phone.trim()) return "Provide at least an email or a phone number.";
  if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return "Enter a valid email address.";
  if (form.preferred_contact_method === "email" && !form.email.trim()) return "Email is required when the preferred contact method is email.";
  if (form.preferred_contact_method === "phone" && !form.phone.trim()) return "Phone is required when the preferred contact method is phone.";
  if (!form.description.trim()) return "A description of the incident is required.";
  if (form.description.length > MAX_DESCRIPTION_CHARS) return `Description must be ${MAX_DESCRIPTION_CHARS.toLocaleString()} characters or fewer.`;
  return null;
}

export function IntakeForm({ onResult }: IntakeFormProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return; // guard against double-submit

    const validationError = clientSideError(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    const submission: IntakeSubmission = {
      client_name: form.client_name.trim(),
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      incident_date: form.incident_date || undefined,
      injury_type: form.injury_type.trim() || undefined,
      description: form.description.trim(),
      preferred_contact_method: form.preferred_contact_method,
    };

    setSubmitting(true);
    setError(null);
    try {
      const response = await submitIntake(submission);
      onResult(response);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong analyzing the intake. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Client name" htmlFor="client_name" required>
          <Input
            id="client_name"
            value={form.client_name}
            onChange={(e) => update("client_name", e.target.value)}
            placeholder="Jane Doe"
            autoComplete="off"
          />
        </Field>

        <Field label="Preferred contact method" htmlFor="preferred_contact_method">
          <Select
            value={form.preferred_contact_method}
            onValueChange={(v) => update("preferred_contact_method", v as ContactMethod)}
          >
            <SelectTrigger id="preferred_contact_method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CONTACT_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {CONTACT_METHOD_LABELS[m]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="jane@example.com"
            autoComplete="off"
          />
        </Field>

        <Field label="Phone" htmlFor="phone">
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
            placeholder="555-555-5555"
            autoComplete="off"
          />
        </Field>

        <Field label="Incident date" htmlFor="incident_date">
          <Input
            id="incident_date"
            type="date"
            value={form.incident_date}
            onChange={(e) => update("incident_date", e.target.value)}
          />
        </Field>

        <Field label="Injury type" htmlFor="injury_type">
          <Input
            id="injury_type"
            value={form.injury_type}
            onChange={(e) => update("injury_type", e.target.value)}
            placeholder="Neck and back injury"
            autoComplete="off"
          />
        </Field>
      </div>

      <Field label="Description of the incident" htmlFor="description" required>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="Briefly describe what happened. Enter demo/fake data only."
          rows={6}
          maxLength={MAX_DESCRIPTION_CHARS}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">
          {form.description.length.toLocaleString()} / {MAX_DESCRIPTION_CHARS.toLocaleString()}
        </p>
      </Field>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            Analyzing…
          </>
        ) : (
          <>
            <Send className="size-4" data-icon="inline-start" />
            Analyze intake
          </>
        )}
      </Button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
