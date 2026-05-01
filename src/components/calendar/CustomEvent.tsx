import type { EventProps } from "react-big-calendar";
import type { CalendarEvent } from "@/lib/calendarHelpers";
import { formatDuration } from "@/lib/calendarHelpers";

export default function CustomEvent({ event }: EventProps<CalendarEvent>) {
  return (
    <div
      className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs h-full overflow-hidden"
      style={{
        backgroundColor: event.tagColor,
        borderLeft: event.status === "interrupted" ? "3px dashed rgba(255,255,255,0.5)" : undefined,
      }}
    >
      <span className="font-medium text-white truncate">
        {event.tagName}
      </span>
      <span className="text-white/70 shrink-0">
        {formatDuration(event.actualDuration)}
      </span>
      {event.status === "interrupted" && (
        <span className="text-white/60 text-[10px] shrink-0">⚡</span>
      )}
    </div>
  );
}
