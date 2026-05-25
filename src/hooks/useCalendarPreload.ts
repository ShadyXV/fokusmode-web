import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useMemo } from "react";
import { get3MonthBufferRange } from "@/lib/calendarHelpers";

/**
 * Custom hook to pre-warm and keep alive the Convex query cache for the calendar view.
 * By calling this in a persistent parent layout component (like AppLayout),
 * the data WebSocket subscription is held open and cached, enabling instant rendering
 * on tab switches.
 */
export function useCalendarPreload() {
  const preloadRange = useMemo(() => {
    return get3MonthBufferRange(new Date());
  }, []);

  // Pre-warm calendar queries and tags in client cache
  useQuery(api.sessions.listByDateRange, preloadRange);
  useQuery(api.breaks.listByDateRange, preloadRange);
  useQuery(api.tags.list);
}
