import type { CalendarEvent } from "@/lib/calendarHelpers";
import { formatDuration } from "@/lib/calendarHelpers";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, Target, Zap } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface SessionDetailPopoverProps {
  event: CalendarEvent;
  children: React.ReactNode;
}

export default function SessionDetailPopover({
  event,
  children,
}: SessionDetailPopoverProps) {
  const tags = useQuery(api.tags.list);
  const updateTag = useMutation(api.sessions.updateTag);

  const handleTagChange = async (newTagId: string) => {
    try {
      await updateTag({
        id: event.id as Id<"sessions">,
        tagId: newTagId as Id<"tags">,
      });
      toast.success("Tag updated");
    } catch {
      toast.error("Failed to update tag");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 glass-dark" side="right" align="start">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: event.tagColor }}
            >
              <span className="text-white text-xs font-bold">
                {event.tagName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <Select value={event.tagId} onValueChange={handleTagChange}>
                <SelectTrigger className="h-6 w-full border-none shadow-none px-0 py-0 focus:ring-0 font-semibold text-sm hover:text-primary transition-colors">
                  <div className="truncate text-left w-full"><SelectValue /></div>
                </SelectTrigger>
                <SelectContent>
                  {tags?.map((tag) => (
                    <SelectItem key={tag._id} value={tag._id}>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {format(event.start, "MMM d, yyyy")}
              </p>
            </div>
            <Badge variant={event.status === "completed" ? "default" : "secondary"} className="text-[10px] shrink-0">
              {event.status === "completed" ? "✓ Done" : "⚡ Interrupted"}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Time</p>
                <p className="text-xs font-medium">
                  {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Planned</p>
                <p className="text-xs font-medium">
                  {formatDuration(event.plannedDuration)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-muted-foreground" />
              <div>
                <p className="text-[10px] text-muted-foreground">Actual</p>
                <p className="text-xs font-medium">
                  {formatDuration(event.actualDuration)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
