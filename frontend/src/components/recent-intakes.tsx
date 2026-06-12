import { useEffect, useState } from "react";
import { Inbox, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { listIntakes } from "@/lib/api";
import { CASE_TYPE_LABELS } from "@/lib/types";
import type { SavedIntakeRecord, UrgencyLevel } from "@/lib/types";

const URGENCY_DOT: Record<UrgencyLevel, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

/** `refreshSignal` — bump this number to trigger a re-fetch (e.g. after a submit). */
export function RecentIntakes({ refreshSignal = 0 }: { refreshSignal?: number }) {
  const [records, setRecords] = useState<SavedIntakeRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listIntakes()
      .then((rows) => active && setRecords(rows))
      .catch(() => active && setRecords([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [refreshSignal]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Loading recent intakes…
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
        <Inbox className="size-6" />
        <p>No intakes yet. Submit the form to see results here.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-lg border">
      {records.map((record) => (
        <li key={record.id} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{record.analysis.client_name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {CASE_TYPE_LABELS[record.analysis.case_type]} ·{" "}
              {new Date(record.created_at).toLocaleString()}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0 gap-1.5">
            <span className={cn("size-1.5 rounded-full", URGENCY_DOT[record.analysis.urgency_level])} />
            {record.analysis.urgency_level}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
