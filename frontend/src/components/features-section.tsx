import type React from "react";
import {
  Scale,
  AlarmClock,
  ListChecks,
  Mail,
  ShieldCheck,
  FileLock2,
  Bot,
  Database,
} from "lucide-react";

const features = [
  {
    icon: Scale,
    title: "Case classification",
    body: "Every inquiry is sorted into auto, rideshare, premises, catastrophic, wrongful death, or unclear — with a conservative precedence order.",
  },
  {
    icon: AlarmClock,
    title: "Urgency & SOL screening",
    body: "Severity keywords and incident-date heuristics flag matters that need prompt human review and possible statute-of-limitations concerns.",
  },
  {
    icon: ListChecks,
    title: "Missing-info detection",
    body: "The agent lists exactly what's missing — contact details, dates, injury specifics — so follow-up is targeted.",
  },
  {
    icon: Mail,
    title: "Drafted follow-up email",
    body: "A ready-to-send, disclaimer-safe client email is generated for every intake, tailored to the matter type.",
  },
];

const steps = [
  { icon: Bot, title: "1. Submit", body: "A prospective client fills in the intake form with their incident details." },
  { icon: Scale, title: "2. Analyze", body: "The AI classifies the matter, scores urgency, and extracts structured fields." },
  { icon: Database, title: "3. Organize", body: "Results are saved and surfaced to staff, ready for attorney review and routing." },
];

export function FeaturesSection() {
  return (
    <section id="features" className="mx-auto w-full max-w-4xl scroll-mt-24 px-4 py-16 md:py-24">
      <div className="mx-auto max-w-xl text-center">
        <h2 className="text-2xl font-semibold md:text-4xl">Everything an intake needs, automatically</h2>
        <p className="mt-3 text-muted-foreground">
          From first contact to a prioritized, structured case file — without the manual data entry.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border bg-card p-5 transition-colors hover:border-primary/40">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="size-5" />
            </div>
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </div>

      <div id="how-it-works" className="scroll-mt-24 pt-20">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-semibold md:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Three steps from inquiry to organized case.</p>
        </div>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-xl border bg-card p-6 text-center">
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <s.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div id="security" className="scroll-mt-24 pt-20">
        <div className="mx-auto max-w-3xl rounded-2xl border bg-card p-8 md:p-10">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <h2 className="mt-4 text-2xl font-semibold md:text-3xl">Built with safety in mind</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <SecurityPoint icon={FileLock2} title="No keys in the browser">
              AI calls run server-side. The OpenAI key never reaches frontend JavaScript.
            </SecurityPoint>
            <SecurityPoint icon={ShieldCheck} title="Prompt-injection aware">
              Client text is treated as untrusted narrative — never as instructions to the model.
            </SecurityPoint>
            <SecurityPoint icon={FileLock2} title="PII redaction">
              Audit logs mask email and phone, and the UI asks for demo data only.
            </SecurityPoint>
            <SecurityPoint icon={ShieldCheck} title="Not legal advice">
              Outputs are administrative screening aids, with disclaimers throughout.
            </SecurityPoint>
          </div>
        </div>
      </div>
    </section>
  );
}

function SecurityPoint({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof ShieldCheck;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
