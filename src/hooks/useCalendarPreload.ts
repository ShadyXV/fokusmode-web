import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMemo } from "react";
import { get3MonthBufferRange, getStatsTimeRanges } from "@/lib/calendarHelpers";

/**
 * Custom hook to pre-warm and keep alive the Convex query cache for all primary tabs
 * in the FokusMode application. By calling this in a persistent parent layout component
 * (AppLayout), WebSocket subscriptions are held open and cached in the background,
 * enabling instantaneous render responses across Focus, Calendar, Stats, and Distraction views.
 */
export function useCalendarPreload() {
  const now = useMemo(() => new Date(), []);

  // 1. Calendar view ranges (3-month buffer from today)
  const calendarRange = useMemo(() => get3MonthBufferRange(now), [now]);

  // 2. Stats page date ranges
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

  // --- PERSISTENT SUBSCRIPTIONS (PRE-WARMING THE CACHE) ---

  // Focus View & Tags Page
  useQuery(api.tags.list);
  useQuery(api.tags.getDefault);

  // Calendar View
  useQuery(api.sessions.listByDateRange, calendarRange);
  useQuery(api.breaks.listByDateRange, calendarRange);

  // Stats View
  useQuery(api.sessions.getStats, { start: todayStart, end: todayEnd });
  useQuery(api.breaks.getStats, { start: todayStart, end: todayEnd });
  useQuery(api.sessions.getStats, { start: thisWeekStart, end: thisWeekEnd });
  useQuery(api.sessions.getStats, { start: lastWeekStart, end: lastWeekEnd });
  useQuery(api.sessions.getDailyBreakdown, { start: sevenDaysAgo, end: todayEnd });
  useQuery(api.sessions.listByDateRange, { start: thirtyDaysAgo, end: todayEnd });

  // Distractions View
  useQuery(api.distractionTags.list);
  useQuery(api.distractions.listByDateRange, { start: todayStart, end: todayEnd });
}
