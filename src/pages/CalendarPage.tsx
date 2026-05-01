import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Calendar as BigCalendar, dateFnsLocalizer, type View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  sessionsToEvents,
  getDateRangeForView,
  type CalendarEvent,
} from "@/lib/calendarHelpers";
import CustomToolbar from "@/components/calendar/CustomToolbar";
import CustomEvent from "@/components/calendar/CustomEvent";
import SessionDetailPopover from "@/components/calendar/SessionDetailPopover";
import { Calendar as CalendarIcon } from "lucide-react";

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

  const dateRange = useMemo(
    () => getDateRangeForView(currentDate, view as "month" | "week" | "day"),
    [currentDate, view]
  );

  const sessions = useQuery(api.sessions.listByDateRange, {
    start: dateRange.start,
    end: dateRange.end,
  });
  const tags = useQuery(api.tags.list);

  const events = useMemo(() => {
    if (!sessions || !tags) return [];
    return sessionsToEvents(
      sessions as Array<{
        _id: string;
        tagId: string;
        plannedDuration: number;
        actualDuration: number;
        status: "completed" | "interrupted";
        startedAt: number;
        endedAt: number;
      }>,
      tags as Array<{ _id: string; name: string; color: string }>
    );
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

      {events.length === 0 && !sessions ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <CalendarIcon className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No sessions yet</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Start a focus session and it will appear here on the calendar.
          </p>
        </div>
      ) : (
        <div className="h-[calc(100vh-12rem)]">
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
      )}
    </div>
  );
}
