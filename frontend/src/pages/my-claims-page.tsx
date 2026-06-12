import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, FolderOpen, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/app-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { listMyClaims } from "@/lib/claims";
import { CASE_TYPE_LABELS } from "@/lib/types";
import type { SavedIntakeRecord, UrgencyLevel } from "@/lib/types";

const URGENCY_DOT: Record<UrgencyLevel, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export function MyClaimsPage() {
  const [claims, setClaims] = useState<SavedIntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listMyClaims()
      .then((rows) => active && setClaims(rows))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="min-h-svh bg-background">
      <AppHeader>
        <Button asChild variant="ghost" size="sm">
          <Link to="/app">
            <Plus className="size-4" data-icon="inline-start" />
            New claim
          </Link>
        </Button>
        <ThemeToggle />
      </AppHeader>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold tracking-tight md:text-3xl">My claims</h1>

        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : claims.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-12 text-center">
            <FolderOpen className="size-7 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">You haven't submitted any claims yet.</p>
            <Button asChild size="sm">
              <Link to="/app">Start a claim</Link>
            </Button>
          </div>
        ) : (
          <ul className="t-skel-content is-revealed divide-y rounded-lg border">
            {claims.map((claim) => (
              <li key={claim.id}>
                <Link
                  to={`/claims/${claim.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{CASE_TYPE_LABELS[claim.analysis.case_type]}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Submitted {new Date(claim.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className="gap-1.5">
                      <span className={cn("size-1.5 rounded-full", URGENCY_DOT[claim.analysis.urgency_level])} />
                      {claim.analysis.urgency_level}
                    </Badge>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
