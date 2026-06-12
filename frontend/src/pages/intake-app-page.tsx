import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldAlert, Sparkles } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { IntakeForm } from "@/components/intake-form";
import { ResultCard } from "@/components/result-card";
import { RecentIntakes } from "@/components/recent-intakes";
import { isDemoMode } from "@/lib/api";
import type { IntakeResponse } from "@/lib/types";

export function IntakeAppPage() {
  const [result, setResult] = useState<IntakeResponse | null>(null);
  const [refreshSignal, setRefreshSignal] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);

  function handleResult(response: IntakeResponse) {
    setResult(response);
    setRefreshSignal((n) => n + 1);
    // Bring the result into view after it renders.
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link to="/" className="rounded-md p-1.5 hover:bg-muted">
            <Logo className="h-5" />
          </Link>
          <div className="flex items-center gap-2">
            {isDemoMode && (
              <Badge variant="outline" className="gap-1.5">
                <Sparkles className="size-3" />
                Demo mode
              </Badge>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <ArrowLeft className="size-4" data-icon="inline-start" />
                Back to site
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Client Intake</h1>
          <p className="text-muted-foreground">
            AI-powered personal injury intake. Submit the details below to get a structured analysis.
          </p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" />
          <p>
            <strong>Portfolio demo — not legal advice.</strong> Please enter fake / demo data only. Do not submit real
            client information.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>New intake</CardTitle>
                <CardDescription>All fields marked * are required.</CardDescription>
              </CardHeader>
              <CardContent>
                <IntakeForm onResult={handleResult} />
              </CardContent>
            </Card>

            {result && (
              <div ref={resultRef} className="scroll-mt-20">
                <h2 className="mb-3 text-lg font-semibold">Analysis</h2>
                <ResultCard response={result} />
              </div>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-20">
              <h2 className="mb-3 text-lg font-semibold">Recent intakes</h2>
              <RecentIntakes refreshSignal={refreshSignal} />
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
