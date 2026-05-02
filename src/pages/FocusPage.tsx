import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTimerContext } from "@/context/TimerContext";
import { useTimerSound } from "@/hooks/useTimerSound";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Zap, Coffee, Minus, Plus } from "lucide-react";
import { useRef } from "react";

const PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "30m", seconds: 30 * 60 },
  { label: "45m", seconds: 45 * 60 },
  { label: "60m", seconds: 60 * 60 },
  { label: "90m", seconds: 90 * 60 },
];

const BREAK_PRESETS = [
  { label: "5m", seconds: 5 * 60 },
  { label: "15m", seconds: 15 * 60 },
  { label: "20m", seconds: 20 * 60 },
  { label: "30m", seconds: 30 * 60 },
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
  const initSeed = useMutation(api.seed.initialize);

  const {
    timer,
    sessionMode,
    setSessionMode,
    selectedTagId,
    setSelectedTagId,
    lastRecorded,
    handleTimerEnd,
  } = useTimerContext();

  const { playStart } = useTimerSound();

  const [selectedDuration, setSelectedDuration] = useState<number>(25 * 60);
  const [breakDuration, setBreakDuration] = useState<number>(5 * 60);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragDeltaX, setDragDeltaX] = useState(0);

  const dragStartX = useRef(0);
  const dragStartVal = useRef(0);

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

  const handleStartFocus = () => {
    setSessionMode("focus");
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    playStart();
    timer.start(selectedDuration);
  };

  const handleStartBreak = () => {
    setSessionMode("break");
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
    playStart();
    timer.start(breakDuration);
  };

  const handleEnd = () => {
    handleTimerEnd(false);
  };

  const handlePreset = (seconds: number, label: string) => {
    setSelectedDuration(seconds);
    setActivePreset(label);
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
          <Badge variant={sessionMode === "break" ? "outline" : "secondary"} className={`animate-pulse ${sessionMode === "break" ? "text-emerald-500 border-emerald-500/50" : ""}`}>
            {sessionMode === "break" ? <Coffee className="w-3 h-3 mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
            {sessionMode === "break" ? "On Break" : "Focusing"}
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
            stroke={timer.isRunning ? (sessionMode === "break" ? "hsl(158, 82%, 46%)" : "hsl(var(--primary))") : "hsl(var(--muted-foreground))"}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-300 ease-linear"
            style={{
              filter: timer.isRunning ? (sessionMode === "break" ? "drop-shadow(0 0 8px hsl(158 82% 46% / 0.5))" : "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))") : "none",
            }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-mono font-light tracking-tighter tabular-nums">
            {timer.isRunning || timer.elapsed > 0
              ? formatTime(timer.timeRemaining)
              : formatTime(sessionMode === "break" ? breakDuration : selectedDuration)}
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
        <div className="flex flex-wrap items-center justify-center gap-3 w-full max-w-2xl">
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
          <div
            className={`flex items-center bg-background/50 border border-white/10 rounded-full h-9 px-1 shadow-inner group cursor-ew-resize select-none`}
            style={{
              transform: isDragging 
                ? `scaleX(${1 + Math.min(0.12, Math.abs(dragDeltaX) / 800)})` 
                : "scaleX(1)",
              transformOrigin: dragDeltaX > 0 ? "left" : "right",
              transition: isDragging 
                ? "transform 100ms ease-out" 
                : "transform 500ms cubic-bezier(0.175, 0.885, 0.32, 1.275)"
            }}
            title="Drag left/right or click buttons"
            onPointerDown={(e) => {
              setIsDragging(true);
              setDragDeltaX(0);
              dragStartX.current = e.clientX;
              dragStartVal.current = selectedDuration;
              e.currentTarget.setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
              const deltaX = e.clientX - dragStartX.current;
              setDragDeltaX(deltaX);
              
              if (Math.abs(deltaX) < 5) return; // ignore tiny movements

              const deltaMins = Math.round(deltaX / 3);
              const newSecs = Math.max(60, Math.min(180 * 60, dragStartVal.current + deltaMins * 60));
              setSelectedDuration(newSecs);
              setActivePreset(null);
            }}
            onPointerUp={(e) => {
              setIsDragging(false);
              setDragDeltaX(0);
              e.currentTarget.releasePointerCapture(e.pointerId);
            }}
            onPointerCancel={() => {
              setIsDragging(false);
              setDragDeltaX(0);
            }}
          >
            <button
              onClick={(e) => {
                // Only trigger if it wasn't a significant drag
                const deltaX = Math.abs(e.clientX - dragStartX.current);
                if (deltaX > 10) return;
                setSelectedDuration(Math.max(60, selectedDuration - 5 * 60));
                setActivePreset(null);
              }}
              className="p-1.5 hover:bg-white/10 rounded-full text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
              title="Decrease 5m"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="w-12 text-center text-sm font-medium text-foreground">
              {Math.round(selectedDuration / 60)}m
            </div>
            <button
              onClick={(e) => {
                // Only trigger if it wasn't a significant drag
                const deltaX = Math.abs(e.clientX - dragStartX.current);
                if (deltaX > 10) return;
                setSelectedDuration(Math.min(180 * 60, selectedDuration + 5 * 60));
                setActivePreset(null);
              }}
              className="p-1.5 hover:bg-white/10 rounded-full text-muted-foreground hover:text-foreground transition-colors pointer-events-auto"
              title="Increase 5m"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {timer.isRunning && sessionMode === "focus" ? (
            <Button
              size="lg"
              variant="destructive"
              onClick={handleEnd}
              className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-destructive/20"
            >
              <Square className="w-5 h-5 mr-2" />
              End Focus
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleStartFocus}
              disabled={selectedDuration <= 0 || (timer.isRunning && sessionMode === "break")}
              className="rounded-full px-8 h-12 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Focus
            </Button>
          )}

          <div className={`flex items-center gap-2 p-2 rounded-2xl border transition-all duration-300 ${timer.isRunning && sessionMode === "focus" ? "opacity-50 pointer-events-none border-transparent bg-transparent" : "bg-muted/50 border-white/5"}`}>
            <Select value={String(breakDuration)} onValueChange={(val) => setBreakDuration(Number(val))} disabled={timer.isRunning}>
              <SelectTrigger className="w-[80px] h-10 border-none bg-transparent shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BREAK_PRESETS.map((p) => (
                  <SelectItem key={p.label} value={String(p.seconds)}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {timer.isRunning && sessionMode === "break" ? (
              <Button
                variant="destructive"
                onClick={handleEnd}
                className="rounded-xl h-10 px-4"
              >
                <Square className="w-4 h-4 mr-2" />
                End Break
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={handleStartBreak}
                disabled={timer.isRunning && sessionMode === "focus"}
                className="rounded-xl h-10 px-4 bg-[#10b981] hover:bg-[#059669] text-white hover:text-white transition-colors"
              >
                <Coffee className="w-4 h-4 mr-2" />
                Start Break
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Recent session indicator */}
      {lastRecorded && (
        <Card className="glass-dark max-w-sm w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="pt-4 pb-4 flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: lastRecorded.mode === "break" ? "#10b981" : (tags?.find((t) => t._id === lastRecorded.tagId)?.color || "#94a3b8"),
              }}
            >
              {lastRecorded.mode === "break" ? <Coffee className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{lastRecorded.mode === "break" ? "Break recorded" : "Session recorded"}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(Math.round(lastRecorded.elapsed))} / {formatTime(lastRecorded.planned)}
              </p>
            </div>
            <Badge variant={lastRecorded.completed ? "default" : "secondary"}>
              {lastRecorded.completed ? "Completed" : "Interrupted"}
            </Badge>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
