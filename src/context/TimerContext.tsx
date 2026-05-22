import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useTimer } from "@/hooks/useTimer";
import { useSessionPersistence } from "@/hooks/useSessionPersistence";
import { useSessionRecording } from "@/hooks/useSessionRecording";
import type { LastRecordedSession } from "@/hooks/useSessionRecording";
import { formatTime } from "@/lib/utils";
import { toast } from "sonner";

export type { LastRecordedSession };

interface TimerContextValue {
  timer: ReturnType<typeof useTimer>;
  sessionMode: "focus" | "break";
  setSessionMode: (mode: "focus" | "break") => void;
  selectedTagId: string;
  setSelectedTagId: (id: string) => void;
  lastRecorded: LastRecordedSession | null;
  handleTimerEnd: (naturalCompletion: boolean) => Promise<void>;
  startTimer: (duration: number, mode?: "focus" | "break", tagId?: string) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const defaultTag = useQuery(api.tags.getDefault);
  const tags = useQuery(api.tags.list);
  const navigate = useNavigate();
  const timer = useTimer();

  const [sessionMode, setSessionMode] = useState<"focus" | "break">("focus");
  const [selectedTagId, setSelectedTagId] = useState<string>("");

  const persistence = useSessionPersistence();
  const { record, lastRecorded } = useSessionRecording(sessionMode, selectedTagId, defaultTag?._id, timer);

  const sessionSavedRef = useRef(false);
  const isRestoringRef = useRef(true);

  // Stable ref so the onComplete callback always calls the current handleTimerEnd
  const handleTimerEndRef = useRef<(naturalCompletion: boolean) => Promise<void>>(async () => {});

  const handleTimerEnd = useCallback(async (naturalCompletion: boolean) => {
    if (sessionSavedRef.current) return;
    sessionSavedRef.current = true;

    try {
      const result = await record(naturalCompletion);
      if (!result) return;

      persistence.clear();
      timer.reset();
      if (sessionMode === "break") setSessionMode("focus");

      const { recorded, recommendBreak, recommendedBreakDuration } = result;
      const timeStr = formatTime(recorded.elapsed);

      if (recorded.completed) {
        const toastId = toast.success(recorded.mode === "break" ? "Break ended!" : "Session completed!", {
          description: recorded.mode === "break"
            ? `${timeStr} break logged.`
            : `${timeStr} of focused work logged.`,
          action: recommendBreak ? {
            label: `Take ${recommendedBreakDuration / 60}m break`,
            onClick: () => {
              if (timer.isRunning) return;
              setSessionMode("break");
              startTimer(recommendedBreakDuration, "break");
              navigate("/");
              toast.dismiss(toastId);
              toast.success(`${recommendedBreakDuration / 60}m break started!`, {
                description: "Timer is running. Relax and recharge.",
                duration: 3000,
              });
            },
          } : undefined,
          cancel: { label: "Dismiss", onClick: () => {} },
          duration: recommendBreak ? 10000 : 4000,
        });
      } else {
        toast.info(recorded.mode === "break" ? "Break ended" : "Session ended", {
          description: `${timeStr} logged as interrupted.`,
        });
      }
    } catch {
      toast.error("Failed to save session");
    }
  }, [record, persistence, timer, sessionMode, navigate]); // startTimer omitted — hoisted below

  // Keep the ref current so the stable onComplete callback always dispatches to the latest version
  handleTimerEndRef.current = handleTimerEnd;

  const onTimerComplete = useCallback(() => {
    handleTimerEndRef.current(true);
  }, []);

  const startTimer = useCallback((duration: number, mode?: "focus" | "break", tagId?: string) => {
    sessionSavedRef.current = false;
    const now = Date.now();
    const targetMode = mode ?? sessionMode;
    const targetTagId = tagId ?? selectedTagId;
    persistence.save(duration, now, targetMode, targetTagId);
    timer.start(duration, undefined, onTimerComplete);
  }, [timer, sessionMode, selectedTagId, persistence, onTimerComplete]);

  // Restore persisted session on mount
  useEffect(() => {
    if (!isRestoringRef.current) return;
    isRestoringRef.current = false;

    const stored = persistence.restore();
    if (!stored) return;

    const elapsed = (Date.now() - stored.startTime) / 1000;
    setSessionMode(stored.mode);
    setSelectedTagId(stored.tagId);

    if (elapsed < stored.duration) {
      timer.start(stored.duration, stored.startTime, onTimerComplete);
      toast.info("Session restored", { description: `Continuing your ${stored.mode} session.` });
    } else {
      setTimeout(() => {
        handleTimerEndRef.current(true);
        toast.success("Session completed", {
          description: `Your ${stored.mode} session finished while you were away.`,
        });
      }, 1000);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep document title in sync with timer state
  useEffect(() => {
    if (!timer.isRunning) {
      document.title = "FokusMode";
      return;
    }
    const timeStr = formatTime(timer.timeRemaining);
    if (sessionMode === "focus") {
      const tag = tags?.find((t) => t._id === (selectedTagId || defaultTag?._id));
      document.title = `${timeStr} ${tag?.name ?? "Focus"} - FokusMode`;
    } else {
      document.title = `${timeStr} Break - FokusMode`;
    }
  }, [timer.isRunning, timer.timeRemaining, sessionMode, selectedTagId, tags, defaultTag]);

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
