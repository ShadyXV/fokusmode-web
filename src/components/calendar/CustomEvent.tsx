import type { EventProps } from "react-big-calendar";
import type { CalendarEvent } from "@/lib/calendarHelpers";
import { formatDuration } from "@/lib/calendarHelpers";

export default function CustomEvent({ event }: EventProps<CalendarEvent>) {
  if (event.isMonthSummary && event.mostRecent) {
    return (
      <div className="flex flex-col gap-0.5 justify-start overflow-hidden h-full pointer-events-none">
        {/* Most Recent block */}
        <div 
          className="rounded px-1.5 py-1 text-white shadow-sm flex items-center justify-between pointer-events-auto"
          style={{ backgroundColor: event.mostRecent.tagColor }}
        >
          <span className="font-semibold text-xs truncate mr-1">
            {event.mostRecent.tagName}
          </span>
          <span className="text-[10px] opacity-80 shrink-0">
            {formatDuration(event.mostRecent.actualDuration)}
          </span>
        </div>
        
        {/* Others summary */}
        {event.others && event.others.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 mt-0.5 px-1 pointer-events-auto">
            <span className="text-[10px] text-muted-foreground font-medium leading-none mr-0.5">
              +{event.others.length}
            </span>
            {event.others.slice(0, 4).map((other, idx) => (
              <div 
                key={idx} 
                className="w-1.5 h-1.5 rounded-full shadow-sm" 
                style={{ backgroundColor: other.tagColor }} 
              />
            ))}
          </div>
        )}
      </div>
    );
  }

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
