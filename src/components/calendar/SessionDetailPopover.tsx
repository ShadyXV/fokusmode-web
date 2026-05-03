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
import { Clock, Target, Zap, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

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
  const removeSession = useMutation(api.sessions.remove);
  const removeBreak = useMutation(api.breaks.remove);

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

  const handleDelete = async () => {
    try {
      if (event.isBreak) {
        await removeBreak({ id: event.id as Id<"breaks"> });
      } else {
        await removeSession({ id: event.id as Id<"sessions"> });
      }
      toast.success("Session deleted");
    } catch {
      toast.error("Failed to delete session");
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 glass-dark border-white/10 shadow-2xl p-4" side="right" align="start">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
              style={{ backgroundColor: event.tagColor }}
            >
              <span className="text-white text-base font-bold">
                {event.tagName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                {event.isBreak ? (
                  <div className="h-6 flex items-center font-bold text-base">
                    {event.tagName}
                  </div>
                ) : (
                  <Select value={event.tagId} onValueChange={handleTagChange}>
                    <SelectTrigger className="h-6 w-full border-none shadow-none px-0 py-0 focus:ring-0 font-bold text-base hover:text-primary transition-colors text-left overflow-hidden">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tags?.map((tag) => (
                        <SelectItem key={tag._id} value={tag._id}>
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: tag.color }}
                            />
                            {tag.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="flex items-center gap-1">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={handleDelete}
                    title="Delete record"
                  >
                    <Trash2 className="w-[18px] h-[18px]" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                <Calendar className="w-[15px] h-[15px]" />
                {format(event.start, "EEEE, MMM d, yyyy")}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={event.status === "completed" ? "default" : "secondary"} className="text-[10px] py-0.5 font-bold uppercase tracking-wider">
              {event.status === "completed" ? "✓ Completed" : "⚡ Interrupted"}
            </Badge>
          </div>

          <Separator className="bg-white/5" />

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                <Clock className="w-[21px] h-[21px] text-muted-foreground" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Time Period</p>
                <p className="text-sm font-semibold text-foreground">
                  {format(event.start, "h:mm a")} – {format(event.end, "h:mm a")}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <Target className="w-[21px] h-[21px] text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Planned</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDuration(event.plannedDuration)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                  <Zap className="w-[21px] h-[21px] text-muted-foreground" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">Actual</p>
                  <p className="text-sm font-semibold text-foreground">
                    {formatDuration(event.actualDuration)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
