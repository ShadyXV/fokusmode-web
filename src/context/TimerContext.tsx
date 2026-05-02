import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useTimer } from "@/hooks/useTimer";
import { useTimerSound } from "@/hooks/useTimerSound";
import { toast } from "sonner";

export interface LastRecordedSession {
  mode: "focus" | "break";
  elapsed: number;
  planned: number;
  completed: boolean;
  tagId?: string;
}

interface TimerContextValue {
  timer: ReturnType<typeof useTimer>;
  sessionMode: "focus" | "break";
  setSessionMode: (mode: "focus" | "break") => void;
  selectedTagId: string;
  setSelectedTagId: (id: string) => void;
  lastRecorded: LastRecordedSession | null;
  handleTimerEnd: (naturalCompletion: boolean) => Promise<void>;
  startTimer: (duration: number) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const defaultTag = useQuery(api.tags.getDefault);
  const createSession = useMutation(api.sessions.create);
  const createBreak = useMutation(api.breaks.create);

  const timer = useTimer();
  const { playComplete, playInterrupt } = useTimerSound();

  const [sessionMode, setSessionMode] = useState<"focus" | "break">("focus");
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [lastRecorded, setLastRecorded] = useState<LastRecordedSession | null>(null);

  const prevRunningRef = useRef(false);
  const sessionSavedRef = useRef(false);

  const startTimer = useCallback((duration: number) => {
    sessionSavedRef.current = false;
    timer.start(duration);
  }, [timer]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleTimerEnd = useCallback(
    async (naturalCompletion: boolean) => {
      if (sessionSavedRef.current) return;
      sessionSavedRef.current = true;

      const result = naturalCompletion
        ? { actualDuration: timer.plannedDuration, completed: true }
        : timer.end();

      const tagId = selectedTagId || defaultTag?._id;
      if (sessionMode === "focus" && !tagId) return;

      const status = result.completed ? "completed" : "interrupted";
      const now = Date.now();
      const startedAt = now - result.actualDuration * 1000;

      try {
        if (sessionMode === "break") {
          await createBreak({
            plannedDuration: timer.plannedDuration,
            actualDuration: result.actualDuration,
            status,
            startedAt,
            endedAt: now,
          });
        } else {
          await createSession({
            tagId: tagId as Id<"tags">,
            plannedDuration: timer.plannedDuration,
            actualDuration: result.actualDuration,
            status,
            startedAt,
            endedAt: now,
          });
        }

        if (result.completed) {
          playComplete();
          if (Notification.permission === "granted") {
            new Notification("FokusMode", {
              body: sessionMode === "break" 
                ? `Break over! Time to focus.`
                : `Session completed! ${formatTime(result.actualDuration)} focused.`,
            });
          }
          toast.success(sessionMode === "break" ? "Break ended!" : "Session completed!", {
            description: sessionMode === "break"
              ? `${formatTime(result.actualDuration)} break logged.`
              : `${formatTime(result.actualDuration)} of focused work logged.`,
          });
        } else {
          playInterrupt();
          toast.info(sessionMode === "break" ? "Break ended" : "Session ended", {
            description: `${formatTime(result.actualDuration)} logged as interrupted.`,
          });
        }

        setLastRecorded({
          mode: sessionMode,
          elapsed: result.actualDuration,
          planned: timer.plannedDuration,
          completed: result.completed,
          tagId: sessionMode === "focus" ? (tagId as string) : undefined,
        });

        timer.reset();
      } catch {
        toast.error("Failed to save session");
      }
    },
    [timer, selectedTagId, defaultTag, createSession, createBreak, playComplete, playInterrupt, sessionMode]
  );

  useEffect(() => {
    if (prevRunningRef.current && !timer.isRunning && timer.elapsed >= timer.plannedDuration && timer.plannedDuration > 0 && !sessionSavedRef.current) {
      handleTimerEnd(true);
    }
    prevRunningRef.current = timer.isRunning;
  }, [timer.isRunning, timer.elapsed, timer.plannedDuration, handleTimerEnd]);

  useEffect(() => {
    if (timer.isRunning) {
      const timeStr = formatTime(timer.timeRemaining);
      const modeStr = sessionMode === "focus" ? "Focus" : "Break";
      document.title = `${timeStr} ${modeStr} - FokusMode`;
    } else {
      document.title = "FokusMode";
    }
  }, [timer.isRunning, timer.timeRemaining, sessionMode]);

  return (
    <TimerContext.Provider
      value={{
        timer,
        sessionMode,
        setSessionMode,
        selectedTagId,
        setSelectedTagId,
        lastRecorded,
        handleTimerEnd,
        startTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
}

export function useTimerContext() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error("useTimerContext must be used within a TimerProvider");
  }
  return context;
}
