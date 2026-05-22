import { useEffect, useMemo, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { format, startOfDay } from "date-fns";
import { toast } from "sonner";

interface DistractionTag {
  _id: string;
  name: string;
}

export function useDistractionForm(distractionTags: DistractionTag[] | undefined) {
  const createDistraction = useMutation(api.distractions.create);
  const createTag = useMutation(api.distractionTags.create);

  const [description, setDescription] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [tagSearch, setTagSearch] = useState("");
  const [tagPickerOpen, setTagPickerOpen] = useState(false);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedTagId && distractionTags && distractionTags.length > 0) {
      setSelectedTagId(distractionTags[0]._id);
    }
  }, [distractionTags, selectedTagId]);

  const filteredTags = useMemo(() => {
    if (!distractionTags) return [];
    if (!tagSearch.trim()) return distractionTags;
    const lower = tagSearch.toLowerCase();
    return distractionTags.filter((t) => t.name.toLowerCase().includes(lower));
  }, [distractionTags, tagSearch]);

  const exactMatch = useMemo(() => {
    if (!distractionTags || !tagSearch.trim()) return true;
    return distractionTags.some((t) => t.name.toLowerCase() === tagSearch.toLowerCase());
  }, [distractionTags, tagSearch]);

  const selectedTag = distractionTags?.find((t) => t._id === selectedTagId);

  const handlePreset = (minutes: number, label: string) => {
    const now = new Date();
    setStartTime(format(new Date(now.getTime() - minutes * 60 * 1000), "HH:mm"));
    setEndTime(format(now, "HH:mm"));
    setActivePreset(label);
  };

  const handleTimeChange = (type: "start" | "end", value: string) => {
    if (type === "start") setStartTime(value);
    else setEndTime(value);
    setActivePreset(null);
  };

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

  const handleSelectTag = (id: string) => {
    setSelectedTagId(id);
    setTagSearch("");
    setTagPickerOpen(false);
  };

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

  return {
    description, setDescription,
    selectedTagId,
    tagSearch, setTagSearch,
    tagPickerOpen, setTagPickerOpen,
    startTime,
    endTime,
    activePreset,
    filteredTags,
    exactMatch,
    selectedTag,
    handleSelectTag,
    handlePreset,
    handleTimeChange,
    handleSubmit,
    handleCreateInlineTag,
  };
}
