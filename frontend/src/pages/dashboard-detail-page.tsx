import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { ClaimDetail } from "@/components/claim-detail";
import { getIntake } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SavedIntakeRecord } from "@/lib/types";

export function DashboardDetailPage() {
  const { id = "" } = useParams();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [record, setRecord] = useState<SavedIntakeRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getIntake(id)
      .then((r) => active && setRecord(r))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="min-h-svh bg-background">
      <AppHeader homeTo="/dashboard" label="Firm dashboard">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard">
            <ArrowLeft className="size-4" data-icon="inline-start" />
            All intakes
          </Link>
        </Button>
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

      <main className="mx-auto max-w-3xl px-4 py-8">
        {loading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : record ? (
          <>
            <h1 className="mb-6 text-2xl font-semibold tracking-tight">Intake detail</h1>
            <ClaimDetail record={record} />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">Intake not found.</p>
        )}
      </main>
    </div>
  );
}
