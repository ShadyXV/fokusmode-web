import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  sessionsToEvents,
  type CalendarEvent,
} from "@/lib/calendarHelpers";
import CustomToolbar from "@/components/calendar/CustomToolbar";
import CustomEvent from "@/components/calendar/CustomEvent";
import SessionDetailPopover from "@/components/calendar/SessionDetailPopover";


const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales: { "en-US": enUS },
});

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>("month");

  // Always fetch a 3-month buffer (prev, current, next month)
  // This ensures switching views (Month/Week/Day) is instantaneous
  const bufferedRange = useMemo(() => {
    const d = currentDate;
    const start = new Date(d.getFullYear(), d.getMonth() - 1, 1).getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 2, 0, 23, 59, 59, 999).getTime();
    return { start, end };
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const sessions = useQuery(api.sessions.listByDateRange, bufferedRange);
  const tags = useQuery(api.tags.list);

  // Use a ref to keep events visible while loading new ones (prevents blank screen)
  const lastEvents = useRef<CalendarEvent[]>([]);

  const events = useMemo(() => {
    if (!sessions || !tags) return lastEvents.current;
    const newEvents = sessionsToEvents(
      sessions as any[],
      tags as any[]
    );
    lastEvents.current = newEvents;
    return newEvents;
  }, [sessions, tags]);

  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.tagColor,
        borderRadius: "6px",
        border: event.status === "interrupted" ? "1px dashed rgba(255,255,255,0.4)" : "none",
        color: "#fff",
        padding: "1px 4px",
        fontSize: "12px",
      },
    };
  }, []);

  const handleSelectEvent = useCallback((_event: CalendarEvent) => {
    // The popover handles display via the custom event wrapper
  }, []);

  // Wrap events in popover
  const EventWrapper = useCallback(
    ({ event, children }: { event: CalendarEvent; children: React.ReactNode }) => (
      <SessionDetailPopover event={event}>
        <div className="cursor-pointer">{children}</div>
      </SessionDetailPopover>
    ),
    []
  );

  return (
    <div className="p-6 md:p-8 space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">
          Visualize your focus sessions over time
        </p>
      </div>

      <div className="h-[calc(100vh-12rem)] relative">
        {/* Optional loading state can go here, but calendar is always visible */}
        <BigCalendar<CalendarEvent>
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          onNavigate={setCurrentDate}
          view={view as View}
          onView={(v: View) => setView(v)}
          views={["month", "week", "day"]}
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent,
            eventWrapper: EventWrapper as never,
          }}
          eventPropGetter={eventStyleGetter}
          onSelectEvent={handleSelectEvent}
          popup
          selectable={false}
          step={30}
          timeslots={2}
        />
      </div>
    </div>
  );
}
