import { useState, useMemo, useCallback, useRef, cloneElement, isValidElement, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Calendar as BigCalendar, dateFnsLocalizer, type View, type EventWrapperProps } from "react-big-calendar";
import { format, parse, startOfWeek, getDay, isToday } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
  sessionsToEvents,
  breaksToEvents,
  buildMonthSummaries,
  get3MonthBufferRange,
  resolveEventOverlaps,
  type CalendarEvent,
} from "@/lib/calendarHelpers";
import CustomToolbar from "@/components/calendar/CustomToolbar";
import CustomEvent from "@/components/calendar/CustomEvent";
import { cn } from "@/lib/utils";


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

  // Custom component for the date number in Month view
  const DateHeader = ({ label, date }: { label: string; date: Date }) => {
    const today = isToday(date);
    
    return (
      <div className="rbc-button-link py-1 px-2 text-right">
        <span 
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 text-sm font-medium transition-colors",
            today && "bg-primary text-primary-foreground rounded-full",
            !today && "hover:bg-accent hover:text-accent-foreground rounded-md"
          )}
        >
          {label}
        </span>
      </div>
    );
  };

  // Custom component for the column headers (Day/Week views) to prevent touching bottom border
  const CustomHeader = ({ label }: { label: string }) => {
    return (
      <div className="flex flex-col items-center justify-center pb-3 pt-2 text-center text-[11px] font-semibold tracking-wider text-muted-foreground uppercase w-full">
        <span>{label}</span>
      </div>
    );
  };

  // Always fetch a 3-month buffer (prev, current, next month)
  // This ensures switching views (Month/Week/Day) is instantaneous
  const bufferedRange = useMemo(() => {
    return get3MonthBufferRange(currentDate);
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const sessions = useQuery(api.sessions.listByDateRange, bufferedRange);
  const breaks = useQuery(api.breaks.listByDateRange, bufferedRange);
  const tags = useQuery(api.tags.list);

  // Use a ref to keep events visible while loading new ones (prevents blank screen)
  const lastEvents = useRef<CalendarEvent[]>([]);

  const events = useMemo(() => {
    if (!sessions || !breaks || !tags) return lastEvents.current;

    const allEvents = [
      ...sessionsToEvents(sessions as any[], tags as any[]),
      ...breaksToEvents(breaks as any[]),
    ];

    const resolvedEvents = resolveEventOverlaps(allEvents);

    return view === "month" ? buildMonthSummaries(resolvedEvents) : resolvedEvents;
  }, [sessions, breaks, tags, view]);

  // Update lastEvents.current inside useEffect to avoid updating ref during render
  useEffect(() => {
    if (sessions && breaks && tags) {
      lastEvents.current = events;
    }
  }, [events, sessions, breaks, tags]);

  // Custom slot group style getter to force the slot group height (1 hour = 360px)
  const slotGroupPropGetter = useCallback(() => {
    return {
      style: {
        minHeight: "360px", // Each 1-hour slot group is exactly 360px high
      },
    };
  }, []);

  // Custom slot style getter to increase vertical space by 100% + another 200% (360px per hour total)
  const slotPropGetter = useCallback(() => {
    return {
      style: {
        minHeight: "180px", // Each 30-min slot is 180px high, making 1 hour exactly 360px high
      },
    };
  }, []);

  const CustomEventWrapper = useCallback(({ children }: EventWrapperProps<CalendarEvent> & { children?: React.ReactNode }) => {
    if (view === "month" || !isValidElement(children)) return <>{children}</>;

    const props = children.props as { style?: React.CSSProperties };
    const childStyle = props.style || {};
    return cloneElement(children as React.ReactElement<{ style?: React.CSSProperties }>, {
      style: {
        ...childStyle,
        left: "0%",
        width: "100%",
      },
    });
  }, [view]);

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
        width: view === "month" ? undefined : "100%",
      },
    };
  }, [view]);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    if (event.isMonthSummary) {
      setCurrentDate(event.start);
      setView("day");
    }
  }, []);

  return (
    <div className="p-4 md:p-6 flex flex-col h-[calc(100vh-3rem)] md:h-screen max-w-7xl mx-auto">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted-foreground mt-1">
          Visualize your focus sessions over time
        </p>
      </div>

      <div className="flex-1 relative min-h-[500px] overflow-y-auto">
        {/* Optional loading state can go here, but calendar is always visible */}
        <BigCalendar<CalendarEvent>
          style={{ height: view === "month" ? "125%" : "100%" }}
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          onNavigate={setCurrentDate}
          view={view as View}
          onView={(v: View) => setView(v)}
          views={["month", "week", "day"]}
          dayLayoutAlgorithm="no-overlap"
          components={{
            toolbar: CustomToolbar,
            event: CustomEvent,
            eventWrapper: CustomEventWrapper,
            week: {
              header: CustomHeader,
            },
            day: {
              header: CustomHeader,
            },
            month: {
              dateHeader: DateHeader,
            },
          }}
          slotGroupPropGetter={slotGroupPropGetter}
          slotPropGetter={slotPropGetter}
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
