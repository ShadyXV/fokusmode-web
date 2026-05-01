import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useTimer } from "@/hooks/useTimer";
import { useTimerSound } from "@/hooks/useTimerSound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Play, Square, RotateCcw, Zap } from "lucide-react";

const PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "30m", seconds: 30 * 60 },
  { label: "45m", seconds: 45 * 60 },
  { label: "1h", seconds: 60 * 60 },
  { label: "90m", seconds: 90 * 60 },
];

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function FocusPage() {
  const tags = useQuery(api.tags.list);
  const defaultTag = useQuery(api.tags.getDefault);
  const createSession = useMutation(api.sessions.create);
  const initSeed = useMutation(api.seed.initialize);

  const timer = useTimer();
  const { playComplete, playStart, playInterrupt } = useTimerSound();

  const [selectedDuration, setSelectedDuration] = useState<number>(25 * 60);
  const [customMinutes, setCustomMinutes] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const prevRunningRef = useRef(false);
  const sessionSavedRef = useRef(false);

  // Seed default tag on mount
  useEffect(() => {
    initSeed();
  }, [initSeed]);

  // Auto-select most recent tag or default
  useEffect(() => {
    if (selectedTagId) return;
    if (tags && tags.length > 0 && defaultTag) {
      // Pick the last created tag (most recent) that isn't the default
      const nonDefault = tags.filter((t) => t._id !== defaultTag._id);
      if (nonDefault.length > 0) {
        setSelectedTagId(nonDefault[nonDefault.length - 1]._id);
      } else {
        setSelectedTagId(defaultTag._id);
      }
    }
  }, [tags, defaultTag, selectedTagId]);

  // Detect timer natural completion
  useEffect(() => {
    if (prevRunningRef.current && !timer.isRunning && timer.elapsed >= timer.plannedDuration && timer.plannedDuration > 0 && !sessionSavedRef.current) {
      handleTimerEnd(true);
    }
    prevRunningRef.current = timer.isRunning;
  }, [timer.isRunning]);

  const handleTimerEnd = useCallback(
    async (naturalCompletion: boolean) => {
      if (sessionSavedRef.current) return;
      sessionSavedRef.current = true;

      const result = naturalCompletion
        ? { actualDuration: timer.plannedDuration, completed: true }
        : timer.end();

      const tagId = selectedTagId || defaultTag?._id;
      if (!tagId) return;

      const status = result.completed ? "completed" : "interrupted";
      const now = Date.now();
      const startedAt = now - result.actualDuration * 1000;

      try {
        await createSession({
          tagId: tagId as Id<"tags">,
          plannedDuration: timer.plannedDuration,
          actualDuration: result.actualDuration,
          status,
          startedAt,
          endedAt: now,
        });

        if (result.completed) {
          playComplete();
          if (Notification.permission === "granted") {
            new Notification("FokusMode", {
              body: `Session completed! ${formatTime(result.actualDuration)} focused.`,
            });
          }
          toast.success("Session completed!", {
            description: `${formatTime(result.actualDuration)} of focused work logged.`,
          });
        } else {
          playInterrupt();
          toast.info("Session ended", {
            description: `${formatTime(result.actualDuration)} logged as interrupted.`,
          });
        }
      } catch {
        toast.error("Failed to save session");
      }
    },
    [timer, selectedTagId, defaultTag, createSession, playComplete, playInterrupt]
  );

  const handleStart = () => {
    sessionSavedRef.current = false;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    playStart();
    timer.start(selectedDuration);
  };

  const handleEnd = () => {
    handleTimerEnd(false);
  };

  const handleRestart = () => {
    sessionSavedRef.current = false;
    timer.reset();
  };

  const handlePreset = (seconds: number, label: string) => {
    setSelectedDuration(seconds);
    setActivePreset(label);
    setCustomMinutes("");
  };

  const handleCustomInput = (val: string) => {
    setCustomMinutes(val);
    const num = parseInt(val, 10);
    if (num > 0) {
      setSelectedDuration(num * 60);
      setActivePreset(null);
    }
  };

  // SVG ring calculations
  const size = 320;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - timer.progress);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-2rem)] px-4 py-8 space-y-8">
      {/* Tag Selector */}
      <div className="flex items-center gap-3">
        <Select
          value={selectedTagId}
          onValueChange={setSelectedTagId}
          disabled={timer.isRunning}
        >
          <SelectTrigger className="w-56 glass border-white/10">
            <SelectValue placeholder="Select a tag..." />
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
        {timer.isRunning && (
          <Badge variant="secondary" className="animate-pulse">
            <Zap className="w-3 h-3 mr-1" />
            Focusing
          </Badge>
        )}
      </div>

      {/* Timer Ring */}
      <div className="relative flex items-center justify-center">
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            className="opacity-30"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={timer.isRunning ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-300 ease-linear"
            style={{
              filter: timer.isRunning ? "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))" : "none",
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-mono font-light tracking-tighter tabular-nums">
            {timer.isRunning || timer.elapsed > 0
              ? formatTime(timer.timeRemaining)
              : formatTime(selectedDuration)}
          </span>
          {timer.isRunning && (
            <span className="text-xs text-muted-foreground mt-2">
              {formatTime(timer.elapsed)} elapsed
            </span>
          )}
        </div>
      </div>

      {/* Preset buttons */}
      {!timer.isRunning && timer.elapsed === 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant={activePreset === p.label ? "default" : "outline"}
              size="sm"
              onClick={() => handlePreset(p.seconds, p.label)}
              className="rounded-full min-w-[52px] transition-all duration-200"
            >
              {p.label}
            </Button>
          ))}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="min"
              value={customMinutes}
              onChange={(e) => handleCustomInput(e.target.value)}
              className="w-20 rounded-full text-center h-9"
              min={1}
              max={180}
            />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!timer.isRunning && timer.elapsed === 0 && (
          <Button
            size="lg"
            onClick={handleStart}
            disabled={selectedDuration <= 0}
            className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
          >
            <Play className="w-5 h-5 mr-2" />
            Start Focus
          </Button>
        )}
        {timer.isRunning && (
          <Button
            size="lg"
            variant="destructive"
            onClick={handleEnd}
            className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-destructive/20"
          >
            <Square className="w-5 h-5 mr-2" />
            End Session
          </Button>
        )}
        {!timer.isRunning && timer.elapsed > 0 && (
          <Button
            size="lg"
            onClick={handleRestart}
            className="rounded-full px-8 h-12 text-base font-semibold"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            New Session
          </Button>
        )}
      </div>

      {/* Recent session indicator */}
      {!timer.isRunning && timer.elapsed > 0 && (
        <Card className="glass-dark max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: tags?.find((t) => t._id === selectedTagId)?.color || "#94a3b8",
              }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Session recorded</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(Math.round(timer.elapsed))} / {formatTime(timer.plannedDuration)}
              </p>
            </div>
            <Badge variant={timer.elapsed >= timer.plannedDuration ? "default" : "secondary"}>
              {timer.elapsed >= timer.plannedDuration ? "Completed" : "Interrupted"}
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
