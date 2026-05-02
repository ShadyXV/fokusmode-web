import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import DistractionTimeline from "@/components/distractions/DistractionTimeline";
import DistractionTagManager from "@/components/distractions/DistractionTagManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TimePicker } from "@/components/ui/time-picker";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Plus,
  Settings,
  Search,
  Clock,
  Save,
} from "lucide-react";
import { format, startOfDay, endOfDay, addDays, subDays } from "date-fns";

const QUICK_PRESETS = [
  { label: "Past 5m", minutes: 5 },
  { label: "Past 15m", minutes: 15 },
  { label: "Past 30m", minutes: 30 },
];

export default function DistractionsPage() {
  const distractionTags = useQuery(api.distractionTags.list);
  const createDistraction = useMutation(api.distractions.create);
  const removeDistraction = useMutation(api.distractions.remove);
  const createTag = useMutation(api.distractionTags.create);
  const initSeed = useMutation(api.seed.initialize);

  // Form state
  const [description, setDescription] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [tagSearch, setTagSearch] = useState("");
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Timeline state
  const [viewDate, setViewDate] = useState(new Date());
  const [managerOpen, setManagerOpen] = useState(false);

  // Seed on mount
  useEffect(() => {
    initSeed();
  }, [initSeed]);

  // Auto-select first tag
  useEffect(() => {
    if (!selectedTagId && distractionTags && distractionTags.length > 0) {
      setSelectedTagId(distractionTags[0]._id);
    }
  }, [distractionTags, selectedTagId]);

  // Date range for timeline
  const dateRange = useMemo(() => {
    return {
      start: startOfDay(viewDate).getTime(),
      end: endOfDay(viewDate).getTime(),
    };
  }, [viewDate.toDateString()]);

  const distractions = useQuery(api.distractions.listByDateRange, dateRange);

  // Filtered tags for combobox
  const filteredTags = useMemo(() => {
    if (!distractionTags) return [];
    if (!tagSearch.trim()) return distractionTags;
    const lower = tagSearch.toLowerCase();
    return distractionTags.filter((t) =>
      t.name.toLowerCase().includes(lower)
    );
  }, [distractionTags, tagSearch]);

  const exactMatch = useMemo(() => {
    if (!distractionTags || !tagSearch.trim()) return true;
    return distractionTags.some(
      (t) => t.name.toLowerCase() === tagSearch.toLowerCase()
    );
  }, [distractionTags, tagSearch]);

  const selectedTag = distractionTags?.find((t) => t._id === selectedTagId);

  // Preset handlers
  const handlePreset = (minutes: number, label: string) => {
    const now = new Date();
    const start = new Date(now.getTime() - minutes * 60 * 1000);
    setStartTime(format(start, "HH:mm"));
    setEndTime(format(now, "HH:mm"));
    setActivePreset(label);
  };

  const handleTimeChange = (type: "start" | "end", value: string) => {
    if (type === "start") setStartTime(value);
    else setEndTime(value);
    setActivePreset(null);
  };

  // Submit
  const handleSubmit = async () => {
    if (!selectedTagId || !startTime || !endTime) {
      toast.error("Please fill in all fields");
      return;
    }

    const today = startOfDay(new Date());
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const startedAt = new Date(today);
    startedAt.setHours(startH, startM, 0, 0);
    const endedAt = new Date(today);
    endedAt.setHours(endH, endM, 0, 0);

    if (endedAt.getTime() <= startedAt.getTime()) {
      toast.error("End time must be after start time");
      return;
    }

    try {
      await createDistraction({
        distractionTagId: selectedTagId as Id<"distractionTags">,
        description: description.trim() || "(no description)",
        startedAt: startedAt.getTime(),
        endedAt: endedAt.getTime(),
      });
      toast.success("Distraction logged");
      setDescription("");
      setStartTime("");
      setEndTime("");
      setActivePreset(null);
    } catch {
      toast.error("Failed to log distraction");
    }
  };

  // Inline tag creation from combobox
  const handleCreateInlineTag = async () => {
    const trimmed = tagSearch.trim();
    if (!trimmed) return;
    try {
      const id = await createTag({ name: trimmed });
      setSelectedTagId(id);
      setTagSearch("");
      setTagPickerOpen(false);
      toast.success(`Tag "${trimmed}" created`);
    } catch {
      toast.error("Failed to create tag");
    }
  };

  const handleDelete = async (id: Id<"distractions">) => {
    try {
      await removeDistraction({ id });
      toast.success("Distraction deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const isToday =
    viewDate.toDateString() === new Date().toDateString();

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Distractions</h1>
          <p className="text-muted-foreground mt-1">
            Track what pulls you away from focus
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full h-10 px-4"
          onClick={() => setManagerOpen(true)}
        >
          <Settings className="w-6 h-6 mr-2" />
          Manage Tags
        </Button>
      </div>

      {/* Log Form */}
      <div className="glass rounded-2xl p-5 space-y-4 border border-white/5">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-400 mb-1">
          <AlertTriangle className="w-6 h-6" />
          Log a Distraction
        </div>

        {/* Description */}
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What distracted you?"
          className="bg-background/50"
        />

        {/* Tag selector (combobox-style) */}
        <div className="flex items-center gap-3">
          <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[220px] h-10 justify-start gap-2.5 font-medium text-sm"
              >
                <Search className="w-[21px] h-[21px] text-muted-foreground" />
                {selectedTag ? selectedTag.name : "Select tag..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-2" align="start">
              <Input
                value={tagSearch}
                onChange={(e) => setTagSearch(e.target.value)}
                placeholder="Search or create..."
                className="h-8 text-sm mb-2"
                autoFocus
              />
              <ScrollArea className="max-h-[200px]">
                <div className="space-y-0.5">
                  {filteredTags.map((tag) => (
                    <button
                      key={tag._id}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${selectedTagId === tag._id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                        }`}
                      onClick={() => {
                        setSelectedTagId(tag._id);
                        setTagSearch("");
                        setTagPickerOpen(false);
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {!exactMatch && tagSearch.trim() && (
                    <button
                      className="w-full text-left text-sm px-2.5 py-2 rounded-md hover:bg-accent/50 text-amber-400 flex items-center gap-2"
                      onClick={handleCreateInlineTag}
                    >
                      <Plus className="w-[21px] h-[21px]" />
                      Create "{tagSearch.trim()}"
                    </button>
                  )}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          {/* Quick presets */}
          {QUICK_PRESETS.map((p) => (
            <Button
              key={p.label}
              variant={activePreset === p.label ? "default" : "outline"}
              size="sm"
              className="rounded-full"
              onClick={() => handlePreset(p.minutes, p.label)}
            >
              {p.label}
            </Button>
          ))}
        </div>

        {/* Time range */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center bg-background/40 border border-white/5 rounded-xl px-2.5 py-1.5 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all shadow-inner">
            <Clock className="w-6 h-6 text-amber-500/70 ml-1 mr-2" />
            <TimePicker
              value={startTime}
              onChange={(val) => handleTimeChange("start", val)}
            />
            <span className="text-muted-foreground text-xs font-medium mx-2">to</span>
            <TimePicker
              value={endTime}
              onChange={(val) => handleTimeChange("end", val)}
            />
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!selectedTagId || !startTime || !endTime}
            className="ml-auto rounded-full shadow-lg shadow-amber-500/20 bg-amber-600 hover:bg-amber-700 text-white border-none transition-all h-12 px-6 text-base font-bold"
          >
            <Save className="w-10 h-10 mr-2" />
            Log Distraction
          </Button>
        </div>
      </div>

      {/* Timeline section */}
      <div className="space-y-3">
        {/* Date nav */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setViewDate(subDays(viewDate, 1))}
            >
              <ChevronLeft className="w-16 h-16" />
            </Button>
            <span className="text-sm font-bold min-w-[150px] text-center">
              {isToday
                ? "Today"
                : format(viewDate, "EEEE, MMM d")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setViewDate(addDays(viewDate, 1))}
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setViewDate(new Date())}
              >
                Today
              </Button>
            )}
          </div>
          <Badge variant="outline" className="text-amber-400 border-amber-400/30">
            {distractions?.length || 0} distraction
            {(distractions?.length || 0) !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Timeline */}
        {distractions && distractionTags ? (
          <DistractionTimeline
            distractions={distractions as any[]}
            tags={distractionTags as any[]}
            onDelete={handleDelete}
          />
        ) : (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
            Loading...
          </div>
        )}
      </div>

      {/* Tag manager modal */}
      <DistractionTagManager
        open={managerOpen}
        onOpenChange={setManagerOpen}
      />
    </div>
  );
}
