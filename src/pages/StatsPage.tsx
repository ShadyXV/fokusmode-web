import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { formatDuration } from "@/lib/calendarHelpers";
import SummaryCard from "@/components/stats/SummaryCard";
import DailyChart from "@/components/stats/DailyChart";
import WeeklyComparison from "@/components/stats/WeeklyComparison";
import TagBreakdown from "@/components/stats/TagBreakdown";
import SessionHistory from "@/components/stats/SessionHistory";
import { Clock, CheckCircle, Zap, Flame } from "lucide-react";
import { format, subDays, startOfDay, endOfDay, startOfWeek, endOfWeek, subWeeks } from "date-fns";

export default function StatsPage() {
  const now = new Date();

  // Today's range
  const todayStart = startOfDay(now).getTime();
  const todayEnd = endOfDay(now).getTime();

  // This week range
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 }).getTime();
  const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 }).getTime();

  // Last week range
  const lastWeekDate = subWeeks(now, 1);
  const lastWeekStart = startOfWeek(lastWeekDate, { weekStartsOn: 0 }).getTime();
  const lastWeekEnd = endOfWeek(lastWeekDate, { weekStartsOn: 0 }).getTime();

  // Last 7 days for chart
  const sevenDaysAgo = subDays(startOfDay(now), 6).getTime();

  // Last 30 days for overall stats
  const thirtyDaysAgo = subDays(startOfDay(now), 29).getTime();

  const todayStats = useQuery(api.sessions.getStats, { start: todayStart, end: todayEnd });
  const thisWeekStats = useQuery(api.sessions.getStats, { start: thisWeekStart, end: thisWeekEnd });
  const lastWeekStats = useQuery(api.sessions.getStats, { start: lastWeekStart, end: lastWeekEnd });
  const dailyBreakdown = useQuery(api.sessions.getDailyBreakdown, { start: sevenDaysAgo, end: todayEnd });
  const recentSessions = useQuery(api.sessions.listByDateRange, { start: thirtyDaysAgo, end: todayEnd });
  const tags = useQuery(api.tags.list);

  // Calculate streak
  const streak = useMemo(() => {
    if (!recentSessions) return 0;
    let count = 0;
    const today = startOfDay(now);
    for (let i = 0; i < 365; i++) {
      const checkDate = subDays(today, i);
      const dateStr = format(checkDate, "yyyy-MM-dd");
      const hasSessions = recentSessions.some((s) => {
        const sessionDate = format(new Date(s.startedAt), "yyyy-MM-dd");
        return sessionDate === dateStr;
      });
      if (hasSessions) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [recentSessions, now]);

  // Daily chart data
  const chartData = useMemo(() => {
    const days: { date: string; minutes: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(now, i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayLabel = format(d, "EEE");
      const dayData = dailyBreakdown?.[dateStr];
      days.push({
        date: dayLabel,
        minutes: dayData ? Math.round(dayData.duration / 60) : 0,
      });
    }
    return days;
  }, [dailyBreakdown, now]);

  // Tag breakdown data
  const tagBreakdownData = useMemo(() => {
    if (!recentSessions || !tags) return [];
    const tagDurations: Record<string, number> = {};
    for (const s of recentSessions) {
      tagDurations[s.tagId] = (tagDurations[s.tagId] || 0) + s.actualDuration;
    }
    return tags
      .filter((t) => tagDurations[t._id])
      .map((t) => ({
        name: t.name,
        color: t.color,
        duration: tagDurations[t._id] || 0,
      }))
      .sort((a, b) => b.duration - a.duration);
  }, [recentSessions, tags]);

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
