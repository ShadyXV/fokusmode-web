import type { Event } from "react-big-calendar";

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
  tagId: string;
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

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`;
}
