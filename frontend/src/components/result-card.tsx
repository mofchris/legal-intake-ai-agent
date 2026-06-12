import type React from "react";
import { useState } from "react";
import { Check, Copy, FileText, Mail, ListChecks, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CASE_TYPE_LABELS } from "@/lib/types";
import type {
  IntakeResponse,
  StatuteRisk,
  UrgencyLevel,
} from "@/lib/types";

const URGENCY_STYLES: Record<UrgencyLevel, string> = {
  low: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const RISK_STYLES: Record<StatuteRisk, string> = {
  low: "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "border-transparent bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  unknown: "border-transparent bg-muted text-muted-foreground",
};

export function ResultCard({ response }: { response: IntakeResponse }) {
  const { analysis, integrations, intake_id } = response;

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-xl">{analysis.client_name}</CardTitle>
            <CardDescription>
              Intake&nbsp;
              <span className="font-mono text-xs">{intake_id.slice(0, 8)}</span>
              {" · "}Incident date: {analysis.incident_date}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="font-medium">
              {CASE_TYPE_LABELS[analysis.case_type]}
            </Badge>
            <Badge className={cn(URGENCY_STYLES[analysis.urgency_level])}>
              {analysis.urgency_level} urgency
            </Badge>
            <Badge className={cn(RISK_STYLES[analysis.statute_of_limitations_risk])}>
              SOL risk: {analysis.statute_of_limitations_risk}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {analysis.analysis_summary}
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <Detail label="Injury summary">{analysis.injury_summary}</Detail>
          <Detail label="Liability summary">{analysis.liability_summary}</Detail>
        </div>

        <Section icon={<ListChecks className="size-4" />} title="Missing information">
          {analysis.missing_information.length === 0 ? (
            <p className="text-sm text-muted-foreground">None — all key fields were provided.</p>
          ) : (
            <ul className="space-y-1 text-sm text-muted-foreground">
              {analysis.missing_information.map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <ArrowRight className="mt-1 size-3 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section icon={<ArrowRight className="size-4" />} title="Recommended next step">
          <p className="text-sm">{analysis.recommended_next_step}</p>
        </Section>

        <Section icon={<Mail className="size-4" />} title="Draft client follow-up email" copyText={analysis.client_follow_up_email}>
          <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border bg-muted/30 p-3 font-sans text-sm leading-relaxed">
            {analysis.client_follow_up_email}
          </pre>
        </Section>

        <Section icon={<FileText className="size-4" />} title="Internal summary">
          <p className="text-sm text-muted-foreground">{analysis.internal_summary}</p>
        </Section>

        <Separator />

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <IntegrationFlag ok={integrations.local_saved} label="Saved locally" />
          <IntegrationFlag ok={integrations.airtable_saved} label="Airtable" />
          <IntegrationFlag ok={integrations.slack_notified} label="Slack notified" />
        </div>
      </CardContent>
    </Card>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm">{children}</p>
    </div>
  );
}

function Section({
  icon,
  title,
  copyText,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  copyText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-sm font-semibold">
          <span className="text-primary">{icon}</span>
          {title}
        </h4>
        {copyText && <CopyButton text={copyText} />}
      </div>
      {children}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 gap-1.5 text-xs"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
    >
      <span className="t-icon-swap" data-state={copied ? "b" : "a"}>
        <Copy className="t-icon size-3.5" data-icon="a" />
        <Check className="t-icon size-3.5" data-icon="b" />
      </span>
      {copied ? "Copied" : "Copy"}
    </Button>
  );
}

function IntegrationFlag({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("size-1.5 rounded-full", ok ? "bg-emerald-500" : "bg-muted-foreground/40")} />
      {label}
    </span>
  );
}
