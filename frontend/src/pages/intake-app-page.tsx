import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Sparkles, FolderClock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppHeader } from "@/components/app-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { IntakeForm } from "@/components/intake-form";
import { ResultCard } from "@/components/result-card";
import { isDemoMode } from "@/lib/api";
import { recordMyClaim } from "@/lib/claims";
import type { IntakeResponse } from "@/lib/types";

export function IntakeAppPage() {
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  function handleResult(response: IntakeResponse) {
    setResult(response);
    recordMyClaim(response.intake_id); // track as one of the claimant's own claims
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="min-h-svh bg-background">
      <AppHeader>
        {isDemoMode && (
          <Badge variant="outline" className="mr-1 gap-1.5">
            <Sparkles className="size-3" />
            Demo mode
          </Badge>
        )}
        <Button asChild variant="ghost" size="sm">
          <Link to="/claims">
            <FolderClock className="size-4" data-icon="inline-start" />
            My claims
          </Link>
        </Button>
        <ThemeToggle />
      </AppHeader>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Start your claim</h1>
          <p className="text-muted-foreground">
            Tell us what happened. Our system reviews your inquiry and our team follows up.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>Portfolio demo — not legal advice.</strong> Please enter fake / demo data only. Do not submit real
            personal information.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Claim details</CardTitle>
            <CardDescription>All fields marked * are required.</CardDescription>
          </CardHeader>
          <CardContent>
            <IntakeForm onResult={handleResult} />
          </CardContent>
        </Card>

        {result && (
          <div ref={resultRef} className="mt-6 scroll-mt-20 space-y-3">
            <div className="flex items-center gap-2 rounded-lg border border-emerald-300/60 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 className="size-4 shrink-0" />
              <p>
                Your claim was submitted.{" "}
                <Link to="/claims" className="font-medium underline underline-offset-2">
                  View it in My claims
                </Link>
                .
              </p>
            </div>
            <h2 className="text-lg font-semibold">Your summary</h2>
            <ResultCard response={result} />
          </div>
        )}
      </main>
    </div>
  );
}
