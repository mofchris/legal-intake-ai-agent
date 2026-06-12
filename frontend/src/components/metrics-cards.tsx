import { Inbox, AlarmClock, Scale, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CASE_TYPE_LABELS, CASE_TYPES, URGENCY_LEVELS } from "@/lib/types";
import type { CaseType, SavedIntakeRecord, UrgencyLevel } from "@/lib/types";

const URGENCY_BAR: Record<UrgencyLevel, string> = {
  low: "bg-emerald-500",
  medium: "bg-amber-500",
  high: "bg-red-500",
};

export function MetricsCards({ records }: { records: SavedIntakeRecord[] }) {
  const total = records.length;
  const highUrgency = records.filter((r) => r.analysis.urgency_level === "high").length;
  const solHigh = records.filter((r) => r.analysis.statute_of_limitations_risk === "high").length;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const last7 = records.filter((r) => new Date(r.created_at).getTime() >= weekAgo).length;

  const byCase = countBy(records, (r) => r.analysis.case_type);
  const byUrgency = countBy(records, (r) => r.analysis.urgency_level);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Inbox} label="Total intakes" value={total} />
        <Stat icon={AlarmClock} label="High urgency" value={highUrgency} accent="text-red-600 dark:text-red-400" />
        <Stat icon={Scale} label="High SOL risk" value={solHigh} accent="text-amber-600 dark:text-amber-400" />
        <Stat icon={CalendarClock} label="Last 7 days" value={last7} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-sm font-semibold">By case type</h3>
            <Breakdown
              rows={CASE_TYPES.map((c) => ({ key: c, label: CASE_TYPE_LABELS[c as CaseType], count: byCase[c] ?? 0 }))}
              total={total}
              barClass="bg-primary"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-sm font-semibold">By urgency</h3>
            <Breakdown
              rows={URGENCY_LEVELS.map((u) => ({ key: u, label: u, count: byUrgency[u] ?? 0 }))}
              total={total}
              barClassFor={(key) => URGENCY_BAR[key as UrgencyLevel]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Inbox;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 pt-6">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div>
          <p className={cn("text-2xl font-semibold tabular-nums", accent)}>{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Breakdown({
  rows,
  total,
  barClass,
  barClassFor,
}: {
  rows: { key: string; label: string; count: number }[];
  total: number;
  barClass?: string;
  barClassFor?: (key: string) => string;
}) {
  return (
    <ul className="space-y-3">
      {rows.map((row) => {
        const pct = total ? Math.round((row.count / total) * 100) : 0;
        return (
          <li key={row.key} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="capitalize">{row.label}</span>
              <span className="tabular-nums text-muted-foreground">
                {row.count} · {pct}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full", barClassFor ? barClassFor(row.key) : barClass)}
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function countBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const item of items) {
    const k = key(item);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}
