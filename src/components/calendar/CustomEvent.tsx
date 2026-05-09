import type { EventProps } from "react-big-calendar";
import type { CalendarEvent } from "@/lib/calendarHelpers";
import { formatDuration } from "@/lib/calendarHelpers";
import SessionDetailPopover from "./SessionDetailPopover";

export default function CustomEvent({ event }: EventProps<CalendarEvent>) {
  if (event.isMonthSummary && event.segments) {
    const { morning, afternoon, evening } = event.segments;
    
    const activeSegments = [
      { key: "morning", sessions: morning },
      { key: "afternoon", sessions: afternoon },
      { key: "evening", sessions: evening }
    ].filter(s => s.sessions.length > 0);

    const activeCount = activeSegments.length;
    // 1 active: 6 rows, 2 active: 3 rows, 3 active: 2 rows
    const rowBudget = activeCount === 1 ? 6 : (activeCount === 2 ? 3 : 2);

    // Helper to render an individual session pill
    const renderSessionPill = (e: CalendarEvent, isFullRow = false) => (
      <SessionDetailPopover key={e.id} event={e}>
        <div
          className={`rounded shadow-sm cursor-pointer pointer-events-auto overflow-hidden flex items-center transition-all hover:scale-[1.02] active:scale-[0.98] ${
            isFullRow ? "w-full py-0.5 px-1.5 flex-1 min-h-0" : "flex-1 h-full min-w-0 px-0.5 justify-center"
          }`}
          style={{ backgroundColor: e.tagColor }}
          title={`${e.tagName} - ${formatDuration(e.actualDuration)}`}
        >
          <span className={`text-[10px] font-semibold text-white truncate ${!isFullRow && "hidden sm:inline"}`}>
            {e.tagName}
          </span>
          {isFullRow && (
            <span className="text-[9px] text-white/80 ml-auto shrink-0">
              {formatDuration(e.actualDuration)}
            </span>
          )}
        </div>
      </SessionDetailPopover>
    );

    // Helper to render a segment row
    const renderSegment = (sessions: CalendarEvent[], budget: number) => {
      if (sessions.length === 0) return null;

      // Rule: If sessions fit within the row budget, render as full-width rows
      if (sessions.length <= budget) {
        return (
          <div className="flex flex-col gap-0.5 w-full overflow-hidden" style={{ flex: budget }}>
            {sessions.map((s) => renderSessionPill(s, true))}
          </div>
        );
      }

      // Rule: Otherwise, render as a grid across the row budget
      const maxItems = budget * 3;
      const hasOverflow = sessions.length > maxItems;
      const itemsToPlaceCount = hasOverflow ? maxItems - 1 : sessions.length;
      
      // Split itemsToPlace across the rows
      let remainingItems = itemsToPlaceCount;
      let remainingRows = budget;
      const rows: CalendarEvent[][] = [];
      let currentIdx = 0;

      for (let i = 0; i < budget; i++) {
        const itemsInThisRow = Math.ceil(remainingItems / remainingRows);
        rows.push(sessions.slice(currentIdx, currentIdx + itemsInThisRow));
        currentIdx += itemsInThisRow;
        remainingItems -= itemsInThisRow;
        remainingRows--;
      }

      const overflowCount = sessions.length - itemsToPlaceCount;

      return (
        <div className="flex flex-col gap-0.5 w-full overflow-hidden" style={{ flex: budget }}>
          {rows.map((rowItems, rowIdx) => (
            <div key={rowIdx} className="flex flex-row gap-0.5 flex-1 min-h-0 w-full group/segment">
              {rowItems.map((s) => renderSessionPill(s, false))}
              {/* If last row and has overflow, add the pill */}
              {rowIdx === rows.length - 1 && hasOverflow && (
                <div className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full rounded bg-muted/40 text-muted-foreground pointer-events-auto cursor-pointer hover:bg-muted/60 transition-colors">
                  <span className="text-[8px] font-bold leading-none">+{overflowCount}</span>
                  <div className="flex gap-0.5 flex-wrap justify-center px-0.5 max-w-full">
                    {sessions.slice(itemsToPlaceCount, itemsToPlaceCount + 3).map((s, i) => (
                      <div key={i} className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: s.tagColor }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-0.5 justify-start h-full pointer-events-none w-full p-0.5">
        {renderSegment(morning, rowBudget)}
        {renderSegment(afternoon, rowBudget)}
        {renderSegment(evening, rowBudget)}
      </div>
    );
  }

  return (
    <SessionDetailPopover event={event}>
      <div
        className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs h-full overflow-hidden cursor-pointer"
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
    </SessionDetailPopover>
  );
}
