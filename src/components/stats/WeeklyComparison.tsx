import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { formatDuration } from "@/lib/calendarHelpers";

interface WeeklyComparisonProps {
  thisWeek: {
    totalDuration: number;
    sessionCount: number;
    completedCount: number;
  };
  lastWeek: {
    totalDuration: number;
    sessionCount: number;
    completedCount: number;
  };
}

function ComparisonRow({
  label,
  current,
  previous,
  formatter = (v: number) => v.toString(),
}: {
  label: string;
  current: number;
  previous: number;
  formatter?: (v: number) => string;
}) {
  const diff = current - previous;
  const pctChange = previous > 0 ? Math.round((diff / previous) * 100) : current > 0 ? 100 : 0;

  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{formatter(current)}</span>
        <div
          className={`flex items-center gap-0.5 text-xs font-medium ${
            diff > 0
              ? "text-green-400"
              : diff < 0
              ? "text-red-400"
              : "text-muted-foreground"
          }`}
        >
          {diff > 0 ? (
            <ArrowUp className="w-3 h-3" />
          ) : diff < 0 ? (
            <ArrowDown className="w-3 h-3" />
          ) : (
            <Minus className="w-3 h-3" />
          )}
          {Math.abs(pctChange)}%
        </div>
      </div>
    </div>
  );
}

export default function WeeklyComparison({ thisWeek, lastWeek }: WeeklyComparisonProps) {
  const thisRate =
    thisWeek.sessionCount > 0
      ? Math.round((thisWeek.completedCount / thisWeek.sessionCount) * 100)
      : 0;
  const lastRate =
    lastWeek.sessionCount > 0
      ? Math.round((lastWeek.completedCount / lastWeek.sessionCount) * 100)
      : 0;

  return (
    <Card className="glass-dark">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">
          This Week vs Last Week
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <ComparisonRow
          label="Total time"
          current={thisWeek.totalDuration}
          previous={lastWeek.totalDuration}
          formatter={formatDuration}
        />
        <ComparisonRow
          label="Sessions"
          current={thisWeek.sessionCount}
          previous={lastWeek.sessionCount}
        />
        <ComparisonRow
          label="Completion %"
          current={thisRate}
          previous={lastRate}
          formatter={(v) => `${v}%`}
        />
      </CardContent>
    </Card>
  );
}
