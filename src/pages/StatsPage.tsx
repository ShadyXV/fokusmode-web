import { useSessionStats } from "@/hooks/useSessionStats";
import { formatDuration } from "@/lib/calendarHelpers";
import SummaryCard from "@/components/stats/SummaryCard";
import DailyChart from "@/components/stats/DailyChart";
import WeeklyComparison from "@/components/stats/WeeklyComparison";
import TagBreakdown from "@/components/stats/TagBreakdown";
import SessionHistory from "@/components/stats/SessionHistory";
import { Clock, CheckCircle, Zap, Flame, Coffee } from "lucide-react";

export default function StatsPage() {
  const {
    todayStats,
    todayBreaks,
    thisWeekStats,
    lastWeekStats,
    recentSessions,
    tags,
    streak,
    chartData,
    tagBreakdownData,
  } = useSessionStats();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
        <p className="text-muted-foreground mt-1">
          Track your focus habits and progress
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Today"
          value={formatDuration(todayStats?.totalDuration || 0)}
          subtitle={`${todayStats?.sessionCount || 0} session${(todayStats?.sessionCount || 0) !== 1 ? "s" : ""}`}
          icon={Clock}
          iconColor="#3b82f6"
        />
        <SummaryCard
          title="Completed"
          value={String(todayStats?.completedCount || 0)}
          subtitle="sessions today"
          icon={CheckCircle}
          iconColor="#22c55e"
        />
        <SummaryCard
          title="Interrupted"
          value={String(todayStats?.interruptedCount || 0)}
          subtitle="sessions today"
          icon={Zap}
          iconColor="#f59e0b"
        />
        <SummaryCard
          title="Streak"
          value={`${streak} day${streak !== 1 ? "s" : ""}`}
          subtitle="consecutive focus days"
          icon={Flame}
          iconColor="#ef4444"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Break Time"
          value={formatDuration(todayBreaks?.totalDuration || 0)}
          subtitle="total break time today"
          icon={Coffee}
          iconColor="#10b981"
        />
        <SummaryCard
          title="Breaks Taken"
          value={String(todayBreaks?.breakCount || 0)}
          subtitle="breaks today"
          icon={CheckCircle}
          iconColor="#10b981"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyChart data={chartData} />
        <WeeklyComparison
          thisWeek={{
            totalDuration: thisWeekStats?.totalDuration || 0,
            sessionCount: thisWeekStats?.sessionCount || 0,
            completedCount: thisWeekStats?.completedCount || 0,
          }}
          lastWeek={{
            totalDuration: lastWeekStats?.totalDuration || 0,
            sessionCount: lastWeekStats?.sessionCount || 0,
            completedCount: lastWeekStats?.completedCount || 0,
          }}
        />
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TagBreakdown data={tagBreakdownData} />
        <SessionHistory
          sessions={
            (recentSessions as Array<{
              _id: string;
              tagId: string;
              plannedDuration: number;
              actualDuration: number;
              status: "completed" | "interrupted";
              startedAt: number;
              endedAt: number;
            }>) || []
          }
          tags={
            (tags as Array<{ _id: string; name: string; color: string }>) || []
          }
        />
      </div>
    </div>
  );
}
