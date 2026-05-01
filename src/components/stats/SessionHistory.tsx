import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDuration } from "@/lib/calendarHelpers";
import { format } from "date-fns";

interface Session {
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

interface SessionHistoryProps {
  sessions: Session[];
  tags: TagDoc[];
}

export default function SessionHistory({ sessions, tags }: SessionHistoryProps) {
  const tagMap = new Map(tags.map((t) => [t._id, t]));

  const sorted = [...sessions].sort((a, b) => b.startedAt - a.startedAt);

  return (
    <Card className="glass-dark">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Recent Sessions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-80">
          <div className="divide-y divide-border">
            {sorted.slice(0, 50).map((s) => {
              const tag = tagMap.get(s.tagId);
              return (
                <div
                  key={s._id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-accent/30 transition-colors"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: tag?.color || "#94a3b8" }}
                  >
                    <span className="text-white text-xs font-bold">
                      {(tag?.name || "U").charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {tag?.name || "Untagged"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(s.startedAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">
                      {formatDuration(s.actualDuration)}
                    </p>
                    <Badge
                      variant={s.status === "completed" ? "default" : "secondary"}
                      className="text-[10px] mt-0.5"
                    >
                      {s.status === "completed" ? "Done" : "Interrupted"}
                    </Badge>
                  </div>
                </div>
              );
            })}
            {sorted.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No sessions recorded yet
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
