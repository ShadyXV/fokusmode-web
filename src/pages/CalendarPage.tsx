import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  sessionsToEvents,
  breaksToEvents,
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
  const breaks = useQuery(api.breaks.listByDateRange, bufferedRange);
  const tags = useQuery(api.tags.list);

  // Use a ref to keep events visible while loading new ones (prevents blank screen)
  const lastEvents = useRef<CalendarEvent[]>([]);

  const events = useMemo(() => {
    if (!sessions || !breaks || !tags) return lastEvents.current;
    
    const sessionEvents = sessionsToEvents(
      sessions as any[],
      tags as any[]
    );
    const breakEvents = breaksToEvents(breaks as any[]);
    
    const allEvents = [...sessionEvents, ...breakEvents];
    
    if (view === "month") {
      const eventsByDay = new Map<string, CalendarEvent[]>();
      for (const e of allEvents) {
        const dayKey = format(e.start, "yyyy-MM-dd");
        if (!eventsByDay.has(dayKey)) eventsByDay.set(dayKey, []);
        eventsByDay.get(dayKey)!.push(e);
      }

      const monthEvents: CalendarEvent[] = [];
      eventsByDay.forEach((dayEvents, dayKey) => {
        // sort descending by start time (most recent first)
        dayEvents.sort((a, b) => b.start.getTime() - a.start.getTime());
        const mostRecent = dayEvents[0];
        const others = dayEvents.slice(1);

        monthEvents.push({
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
          mostRecent,
          others,
        });
      });
      lastEvents.current = monthEvents;
      return monthEvents;
    }

    lastEvents.current = allEvents;
    return allEvents;
  }, [sessions, breaks, tags, view]);

  const scrollToTime = useMemo(() => {
    const now = new Date();
    // Scroll to 1 hour before current time to provide some context
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Math.max(0, now.getHours() - 1));
  }, []);

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

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.isMonthSummary) {
      setCurrentDate(event.start);
      setView("day");
    }
  }, []);

  // Wrap events in popover
  const EventWrapper = useCallback(
    ({ event, children }: { event: CalendarEvent; children: React.ReactNode }) => {
      if (event.isMonthSummary) {
        return <div className="cursor-pointer h-full relative z-10">{children}</div>;
      }
      return (
        <SessionDetailPopover event={event}>
          <div className="cursor-pointer">{children}</div>
        </SessionDetailPopover>
      );
    },
    []
  );

  return (
    <div className="p-4 md:p-6 flex flex-col h-[calc(100vh-3rem)] md:h-screen max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">
          Visualize your focus sessions over time
        </p>
      </div>

      <div className="flex-1 relative min-h-[500px]">
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
          scrollToTime={scrollToTime}
          popup
          selectable={false}
          step={30}
          timeslots={2}
        />
      </div>
    </div>
  );
}
