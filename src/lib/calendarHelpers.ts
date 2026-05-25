import type { Event } from "react-big-calendar";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, subWeeks } from "date-fns";

export function getStatsTimeRanges(date: Date) {
  const todayStart = startOfDay(date).getTime();
  const todayEnd = endOfDay(date).getTime();
  const thisWeekStart = startOfWeek(date, { weekStartsOn: 0 }).getTime();
  const thisWeekEnd = endOfWeek(date, { weekStartsOn: 0 }).getTime();
  const lastWeekStart = startOfWeek(subWeeks(date, 1), { weekStartsOn: 0 }).getTime();
  const lastWeekEnd = endOfWeek(subWeeks(date, 1), { weekStartsOn: 0 }).getTime();
  const sevenDaysAgo = subDays(startOfDay(date), 6).getTime();
  const thirtyDaysAgo = subDays(startOfDay(date), 29).getTime();

  return {
    todayStart,
    todayEnd,
    thisWeekStart,
    thisWeekEnd,
    lastWeekStart,
    lastWeekEnd,
    sevenDaysAgo,
    thirtyDaysAgo,
  };
}

interface SessionDoc {
  _id: string;
  tagId: string;
  plannedDuration: number;
  actualDuration: number;
  status: "completed" | "interrupted";
  startedAt: number;
  endedAt: number;
}

interface TagDoc {
  _id: string;
  name: string;
  color: string;
}

export interface CalendarEvent extends Event {
  id: string;
  title: string;
  start: Date;
  end: Date;
  tagColor: string;
  tagName: string;
  status: "completed" | "interrupted";
  plannedDuration: number;
  actualDuration: number;
  tagId?: string;
  isBreak?: boolean;
  // Month view summary properties
  isMonthSummary?: boolean;
  segments?: {
    morning: CalendarEvent[];
    afternoon: CalendarEvent[];
    evening: CalendarEvent[];
  };
  totalSessions?: number;
}

export interface BreakDoc {
  _id: string;
  plannedDuration: number;
  actualDuration: number;
  status: "completed" | "interrupted";
  startedAt: number;
  endedAt: number;
}

export function sessionsToEvents(
  sessions: SessionDoc[],
  tags: TagDoc[]
): CalendarEvent[] {
  const tagMap = new Map(tags.map((t) => [t._id, t]));

  return sessions.map((s) => {
    const tag = tagMap.get(s.tagId);
    const start = new Date(s.startedAt);
    
    // Enforce a minimum visual duration (e.g., 15 minutes) so it renders correctly in Week and Day views
    const durationMs = s.endedAt - s.startedAt;
    const minVisualDurationMs = 15 * 60 * 1000; 
    const end = new Date(start.getTime() + Math.max(durationMs, minVisualDurationMs));

    return {
      id: s._id,
      title: tag?.name || "Untagged",
      start,
      end,
      tagColor: tag?.color || "#94a3b8",
      tagName: tag?.name || "Untagged",
      status: s.status,
      plannedDuration: s.plannedDuration,
      actualDuration: s.actualDuration,
      tagId: s.tagId,
    };
  });
}

export function breaksToEvents(breaks: BreakDoc[]): CalendarEvent[] {
  return breaks.map((b) => {
    const start = new Date(b.startedAt);
    
    // Enforce a minimum visual duration (e.g., 15 minutes) so it renders correctly in Week and Day views
    const durationMs = b.endedAt - b.startedAt;
    const minVisualDurationMs = 15 * 60 * 1000; 
    const end = new Date(start.getTime() + Math.max(durationMs, minVisualDurationMs));

    return {
      id: b._id,
      title: "Break",
      start,
      end,
      tagColor: "#10b981", // Emerald
      tagName: "Break",
      status: b.status,
      plannedDuration: b.plannedDuration,
      actualDuration: b.actualDuration,
      isBreak: true,
    };
  });
}

export function get3MonthBufferRange(date: Date): { start: number; end: number } {
  const start = new Date(date.getFullYear(), date.getMonth() - 1, 1).getTime();
  const end = new Date(date.getFullYear(), date.getMonth() + 2, 0, 23, 59, 59, 999).getTime();
  return { start, end };
}

export function getDateRangeForView(
  date: Date,
  view: "month" | "week" | "day"
): { start: number; end: number } {
  const d = new Date(date);

  switch (view) {
    case "month": {
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      start.setDate(start.getDate() - start.getDay()); // Start from Sunday of first week
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      end.setDate(end.getDate() + (6 - end.getDay())); // End on Saturday of last week
      end.setHours(23, 59, 59, 999);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "week": {
      const dayOfWeek = d.getDay();
      const start = new Date(d);
      start.setDate(d.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start: start.getTime(), end: end.getTime() };
    }
    case "day": {
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      return { start: start.getTime(), end: end.getTime() };
    }
  }
}

export function resolveEventOverlaps(events: CalendarEvent[]): CalendarEvent[] {
  // Shallow copy events to avoid mutating source query data
  const copied = events.map(e => ({ ...e }));

  // Sort by start time (earliest first), then by end time descending
  copied.sort((a, b) => {
    const diff = a.start.getTime() - b.start.getTime();
    if (diff !== 0) return diff;
    return b.end.getTime() - a.end.getTime();
  });

  for (let i = 0; i < copied.length - 1; i++) {
    const curr = copied[i];
    const next = copied[i + 1];

    const currStart = curr.start.getTime();
    const currEnd = curr.end.getTime();
    const nextStart = next.start.getTime();

    // If next event starts before current event ends visually, we have an overlap
    if (currEnd > nextStart) {
      // Safely truncate preceding event's end time to match succeeding event's start time with a microscopic 1-second gap.
      // This prevents React Big Calendar from treating them as overlapping columns.
      if (nextStart > currStart) {
        curr.end = new Date(nextStart - 1000);
      }
    }
  }

  return copied;
}

export function buildMonthSummaries(events: CalendarEvent[]): CalendarEvent[] {
  const focusEvents = events.filter((e) => !e.isBreak);
  const eventsByDay = new Map<string, CalendarEvent[]>();

  for (const e of focusEvents) {
    const dayKey = format(e.start, "yyyy-MM-dd");
    if (!eventsByDay.has(dayKey)) eventsByDay.set(dayKey, []);
    eventsByDay.get(dayKey)!.push(e);
  }

  const summaries: CalendarEvent[] = [];
  eventsByDay.forEach((dayEvents, dayKey) => {
    dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    const segments = {
      morning: [] as CalendarEvent[],
      afternoon: [] as CalendarEvent[],
      evening: [] as CalendarEvent[],
    };

    for (const e of dayEvents) {
      const hour = e.start.getHours();
      if (hour >= 5 && hour < 12) segments.morning.push(e);
      else if (hour >= 12 && hour < 18) segments.afternoon.push(e);
      else segments.evening.push(e);
    }

    summaries.push({
      id: `summary-${dayKey}`,
      title: "Summary",
      start: new Date(`${dayKey}T00:00:00`),
      end: new Date(`${dayKey}T23:59:59`),
      allDay: true,
      tagColor: "transparent",
      tagName: "Summary",
      status: "completed",
      plannedDuration: 0,
      actualDuration: 0,
      isMonthSummary: true,
      segments,
      totalSessions: dayEvents.length,
    });
  });

  return summaries;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}
