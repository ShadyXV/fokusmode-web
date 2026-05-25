import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { format, subDays, startOfDay } from "date-fns";
import { getStatsTimeRanges } from "@/lib/calendarHelpers";

export function useSessionStats() {
  const now = useMemo(() => new Date(), []);

  const {
    todayStart,
    todayEnd,
    thisWeekStart,
    thisWeekEnd,
    lastWeekStart,
    lastWeekEnd,
    sevenDaysAgo,
    thirtyDaysAgo,
  } = useMemo(() => getStatsTimeRanges(now), [now]);

  const todayStats = useQuery(api.sessions.getStats, { start: todayStart, end: todayEnd });
  const todayBreaks = useQuery(api.breaks.getStats, { start: todayStart, end: todayEnd });
  const thisWeekStats = useQuery(api.sessions.getStats, { start: thisWeekStart, end: thisWeekEnd });
  const lastWeekStats = useQuery(api.sessions.getStats, { start: lastWeekStart, end: lastWeekEnd });
  const dailyBreakdown = useQuery(api.sessions.getDailyBreakdown, { start: sevenDaysAgo, end: todayEnd });
  const recentSessions = useQuery(api.sessions.listByDateRange, { start: thirtyDaysAgo, end: todayEnd });
  const tags = useQuery(api.tags.list);

  const streak = useMemo(() => {
    if (!recentSessions) return 0;
    let count = 0;
    const today = startOfDay(now);
    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(today, i), "yyyy-MM-dd");
      const hasSession = recentSessions.some(
        (s) => format(new Date(s.startedAt), "yyyy-MM-dd") === dateStr
      );
      if (hasSession) {
        count++;
      } else if (i > 0) {
        break;
      }
    }
    return count;
  }, [recentSessions, now]);

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayData = dailyBreakdown?.[dateStr];
      return {
        date: format(d, "EEE"),
        minutes: dayData ? Math.round(dayData.duration / 60) : 0,
      };
    });
  }, [dailyBreakdown, now]);

  const tagBreakdownData = useMemo(() => {
    if (!recentSessions || !tags) return [];
    const tagDurations: Record<string, number> = {};
    for (const s of recentSessions) {
      tagDurations[s.tagId] = (tagDurations[s.tagId] || 0) + s.actualDuration;
    }
    return tags
      .filter((t) => tagDurations[t._id])
      .map((t) => ({ name: t.name, color: t.color, duration: tagDurations[t._id] || 0 }))
      .sort((a, b) => b.duration - a.duration);
  }, [recentSessions, tags]);

  return {
    todayStats,
    todayBreaks,
    thisWeekStats,
    lastWeekStats,
    recentSessions,
    tags,
    streak,
    chartData,
    tagBreakdownData,
  };
}
