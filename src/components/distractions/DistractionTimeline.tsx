import { useMemo, useRef, useEffect } from "react";
import type { Id } from "../../../convex/_generated/dataModel";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { format } from "date-fns";

interface DistractionDoc {
  _id: Id<"distractions">;
  distractionTagId: Id<"distractionTags">;
  description: string;
  startedAt: number;
  endedAt: number;
  createdAt: number;
}

interface DistractionTagDoc {
  _id: Id<"distractionTags">;
  name: string;
}

interface DistractionTimelineProps {
  distractions: DistractionDoc[];
  tags: DistractionTagDoc[];
  onDelete: (id: Id<"distractions">) => void;
}

const HOUR_HEIGHT = 60; // px per hour
const TOTAL_HEIGHT = 24 * HOUR_HEIGHT; // 1440px
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Warm amber/red palette for distraction blocks
const DISTRACTION_COLOR = "#f59e0b";
const DISTRACTION_BG = "rgba(245, 158, 11, 0.15)";
const DISTRACTION_BORDER = "rgba(245, 158, 11, 0.4)";

function getPositionFromTime(timestamp: number, dayStart: number) {
  const msIntoDay = timestamp - dayStart;
  const hoursIntoDay = msIntoDay / (1000 * 60 * 60);
  return hoursIntoDay * HOUR_HEIGHT;
}

export default function DistractionTimeline({
  distractions,
  tags,
  onDelete,
}: DistractionTimelineProps) {
  const tagMap = useMemo(
    () => new Map(tags.map((t) => [t._id, t])),
    [tags]
  );
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate "now" indicator position
  const now = new Date();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const nowPosition = getPositionFromTime(now.getTime(), dayStart.getTime());

  // Scroll to current time on mount
  useEffect(() => {
    if (containerRef.current) {
      const scrollTarget = Math.max(0, nowPosition - 200);
      containerRef.current.scrollTop = scrollTarget;
    }
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-y-auto rounded-xl border border-white/5 bg-card/30 backdrop-blur-sm"
      style={{ height: "calc(100vh - 380px)", minHeight: "400px" }}
    >
      <div className="relative" style={{ height: TOTAL_HEIGHT }}>
        {/* Hour grid lines */}
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="absolute left-0 right-0 flex"
            style={{ top: hour * HOUR_HEIGHT }}
          >
            <div className="w-16 shrink-0 pr-3 text-right">
              <span className="text-[11px] text-muted-foreground font-medium -translate-y-1/2 inline-block">
                {hour === 0
                  ? "12 AM"
                  : hour < 12
                    ? `${hour} AM`
                    : hour === 12
                      ? "12 PM"
                      : `${hour - 12} PM`}
              </span>
            </div>
            <div className="flex-1 border-t border-white/5" />
          </div>
        ))}

        {/* Now indicator */}
        <div
          className="absolute left-16 right-0 z-20 flex items-center pointer-events-none"
          style={{ top: nowPosition }}
        >
          <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
          <div className="flex-1 h-[1.5px] bg-red-500/70" />
        </div>

        {/* Distraction blocks */}
        {distractions.map((d) => {
          const tag = tagMap.get(d.distractionTagId);
          const top = getPositionFromTime(d.startedAt, dayStart.getTime());
          const bottom = getPositionFromTime(d.endedAt, dayStart.getTime());
          const height = Math.max(30, bottom - top); // min 30px visual height

          return (
            <Popover key={d._id}>
              <PopoverTrigger asChild>
                <div
                  className="absolute left-[72px] right-3 rounded-lg px-3 py-1.5 cursor-pointer transition-all duration-150 hover:scale-[1.01] hover:shadow-md z-10 overflow-hidden"
                  style={{
                    top,
                    height,
                    backgroundColor: DISTRACTION_BG,
                    borderLeft: `3px solid ${DISTRACTION_COLOR}`,
                    border: `1px solid ${DISTRACTION_BORDER}`,
                    borderLeftWidth: "3px",
                  }}
                >
                  <div className="flex items-center gap-2 h-full">
                    <span className="text-xs font-semibold text-amber-400 truncate">
                      {tag?.name || "Unknown"}
                    </span>
                    {height > 36 && (
                      <span className="text-[11px] text-muted-foreground truncate">
                        {d.description}
                      </span>
                    )}
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent
                className="glass-dark w-72 p-4 space-y-3"
                side="left"
                align="start"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge
                      variant="outline"
                      className="text-amber-400 border-amber-400/30 mb-1.5"
                    >
                      {tag?.name || "Unknown"}
                    </Badge>
                    <p className="text-sm">{d.description || "No description"}</p>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>
                    {format(new Date(d.startedAt), "h:mm a")} –{" "}
                    {format(new Date(d.endedAt), "h:mm a")}
                  </p>
                  <p>
                    Duration:{" "}
                    {Math.round((d.endedAt - d.startedAt) / 60000)} min
                  </p>
                  <p>
                    Logged at {format(new Date(d.createdAt), "h:mm a")}
                  </p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => onDelete(d._id)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              </PopoverContent>
            </Popover>
          );
        })}
      </div>
    </div>
  );
}
