import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Sparkles, ChevronRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/app-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { MetricsCards } from "@/components/metrics-cards";
import { cn } from "@/lib/utils";
import { isDemoMode, listIntakes } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { CASE_TYPE_LABELS } from "@/lib/types";
import type { SavedIntakeRecord, StatuteRisk, UrgencyLevel } from "@/lib/types";

const URGENCY_BADGE: Record<UrgencyLevel, string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};
const RISK_LABEL: Record<StatuteRisk, string> = { low: "Low", medium: "Medium", high: "High", unknown: "Unknown" };

export function DashboardPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<SavedIntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listIntakes()
      .then((rows) => active && setRecords(rows))
      .catch(() => active && setRecords([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-svh bg-background">
      <AppHeader homeTo="/dashboard" label="Firm dashboard">
        {isDemoMode && (
          <Badge variant="outline" className="mr-1 gap-1.5">
            <Sparkles className="size-3" />
            Demo mode
          </Badge>
        )}
        <ThemeToggle />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            logout();
            navigate("/");
          }}
        >
          <LogOut className="size-4" data-icon="inline-start" />
          Sign out
        </Button>
      </AppHeader>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Intake dashboard</h1>
          <p className="text-muted-foreground">Monitor incoming claims, urgency, and statute-of-limitations risk.</p>
        </div>

        <MetricsCards records={records} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold">All intakes</h2>
          {loading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading intakes…</p>
          ) : records.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
              <Inbox className="size-6" />
              <p>No intakes yet.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <ul className="divide-y">
                {records.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/dashboard/${r.id}`}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{r.analysis.client_name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {CASE_TYPE_LABELS[r.analysis.case_type]} · {new Date(r.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                        SOL: {RISK_LABEL[r.analysis.statute_of_limitations_risk]}
                      </span>
                      <Badge className={cn("shrink-0 border-transparent", URGENCY_BADGE[r.analysis.urgency_level])}>
                        {r.analysis.urgency_level}
                      </Badge>
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
