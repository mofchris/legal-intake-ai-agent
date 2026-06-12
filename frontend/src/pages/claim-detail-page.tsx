import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClaimDetail } from "@/components/claim-detail";
import { getIntake } from "@/lib/api";
import { isMyClaim } from "@/lib/claims";
import type { SavedIntakeRecord } from "@/lib/types";

export function ClaimDetailPage() {
  const { id = "" } = useParams();
  const [record, setRecord] = useState<SavedIntakeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  // Claimants can only open their own claims.
  const allowed = isMyClaim(id);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    getIntake(id)
      .then((r) => active && setRecord(r))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, allowed]);

  if (!allowed) return <Navigate to="/claims" replace />;

  return (
    <div className="min-h-svh bg-background">
      <AppHeader>
        <Button asChild variant="ghost" size="sm">
          <Link to="/claims">
            <ArrowLeft className="size-4" data-icon="inline-start" />
            My claims
          </Link>
        </Button>
        <ThemeToggle />
      </AppHeader>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : record ? (
          <>
            <h1 className="mb-6 text-2xl font-semibold tracking-tight">Claim detail</h1>
            <ClaimDetail record={record} />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Claim not found.</p>
        )}
      </main>
    </div>
  );
}
