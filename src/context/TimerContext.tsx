import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  startTimer: (duration: number, mode?: "focus" | "break", tagId?: string) => void;
}

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const defaultTag = useQuery(api.tags.getDefault);
  const tags = useQuery(api.tags.list);
  const createSession = useMutation(api.sessions.create);
  const createBreak = useMutation(api.breaks.create);

  const navigate = useNavigate();
  const timer = useTimer();
  const { playComplete, playInterrupt } = useTimerSound();

  const [sessionMode, setSessionMode] = useState<"focus" | "break">("focus");
  const [selectedTagId, setSelectedTagId] = useState<string>("");
  const [lastRecorded, setLastRecorded] = useState<LastRecordedSession | null>(null);

  const prevRunningRef = useRef(false);
  const sessionSavedRef = useRef(false);
  const isRestoringRef = useRef(true);

  // Persistence keys
  const STORAGE_KEYS = {
    ACTIVE: "fokus_session_active",
    START_TIME: "fokus_session_startTime",
    DURATION: "fokus_session_duration",
    MODE: "fokus_session_mode",
    TAG_ID: "fokus_session_tagId",
  };

  const startTimer = useCallback((duration: number, mode?: "focus" | "break", tagId?: string) => {
    sessionSavedRef.current = false;
    const now = Date.now();
    const targetMode = mode || sessionMode;
    const targetTagId = tagId || selectedTagId;

    localStorage.setItem(STORAGE_KEYS.ACTIVE, "true");
    localStorage.setItem(STORAGE_KEYS.START_TIME, String(now));
    localStorage.setItem(STORAGE_KEYS.DURATION, String(duration));
    localStorage.setItem(STORAGE_KEYS.MODE, targetMode);
    localStorage.setItem(STORAGE_KEYS.TAG_ID, targetTagId);

    timer.start(duration);
  }, [timer, sessionMode, selectedTagId]);

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
            const notification = new Notification("FokusMode", {
              body: sessionMode === "break" 
                ? `Break over! Time to focus.`
                : `Session completed! ${formatTime(result.actualDuration)} focused.`,
            });
            notification.onclick = () => {
              window.focus();
            };
          }

          const isLongFocus = sessionMode === "focus" && result.actualDuration > 25 * 60;
          const recommendedBreak = result.actualDuration > 60 * 60 ? 15 * 60 : 5 * 60;

          const toastId = toast.success(sessionMode === "break" ? "Break ended!" : "Session completed!", {
            description: sessionMode === "break"
              ? `${formatTime(result.actualDuration)} break logged.`
              : `${formatTime(result.actualDuration)} of focused work logged.`,
            action: isLongFocus ? {
              label: `Take ${recommendedBreak / 60}m break`,
              onClick: () => {
                if (timer.isRunning) return;
                setSessionMode("break");
                startTimer(recommendedBreak, "break");
                navigate("/");
                toast.dismiss(toastId);
                toast.success(`${recommendedBreak / 60}m break started!`, {
                  description: "Timer is running. Relax and recharge.",
                  duration: 3000,
                });
              }
            } : undefined,
            cancel: { label: "Dismiss", onClick: () => {} },
            duration: isLongFocus ? 10000 : 4000,
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

        // Clear persistence
        localStorage.removeItem(STORAGE_KEYS.ACTIVE);
        localStorage.removeItem(STORAGE_KEYS.START_TIME);
        localStorage.removeItem(STORAGE_KEYS.DURATION);
        localStorage.removeItem(STORAGE_KEYS.MODE);
        localStorage.removeItem(STORAGE_KEYS.TAG_ID);

        timer.reset();
        if (sessionMode === "break") {
          setSessionMode("focus");
        }
      } catch {
        toast.error("Failed to save session");
      }
    },
    [timer, selectedTagId, defaultTag, createSession, createBreak, playComplete, playInterrupt, sessionMode, navigate]
  );

  // Restore session on mount
  useEffect(() => {
    if (!isRestoringRef.current) return;
    isRestoringRef.current = false;

    const isActive = localStorage.getItem(STORAGE_KEYS.ACTIVE) === "true";
    if (isActive) {
      const startTime = Number(localStorage.getItem(STORAGE_KEYS.START_TIME));
      const duration = Number(localStorage.getItem(STORAGE_KEYS.DURATION));
      const mode = localStorage.getItem(STORAGE_KEYS.MODE) as "focus" | "break";
      const tagId = localStorage.getItem(STORAGE_KEYS.TAG_ID) || "";

      const now = Date.now();
      const elapsed = (now - startTime) / 1000;

      if (elapsed < duration) {
        setSessionMode(mode);
        setSelectedTagId(tagId);
        timer.start(duration, startTime);
        toast.info("Session restored", {
          description: `Continuing your ${mode} session.`,
        });
      } else {
        // Session finished while away, backfill it
        setSessionMode(mode);
        setSelectedTagId(tagId);
        
        // Use a small timeout to ensure Convex/State are ready
        setTimeout(() => {
          handleTimerEnd(true);
          toast.success("Session completed", {
            description: `Your ${mode} session finished while you were away.`,
          });
        }, 1000);
      }
    }
  }, []); // Only run on mount

  // Handle natural completion
  useEffect(() => {
    if (prevRunningRef.current && !timer.isRunning && timer.elapsed >= timer.plannedDuration && timer.plannedDuration > 0 && !sessionSavedRef.current) {
      handleTimerEnd(true);
    }
    prevRunningRef.current = timer.isRunning;
  }, [timer.isRunning, timer.elapsed, timer.plannedDuration, handleTimerEnd]);

  // Update document title
  useEffect(() => {
    if (timer.isRunning) {
      const timeStr = formatTime(timer.timeRemaining);
      let newTitle;
      
      if (sessionMode === "focus") {
        const selectedTag = tags?.find(t => t._id === (selectedTagId || defaultTag?._id));
        const tagName = selectedTag?.name || "Focus";
        newTitle = `${timeStr} ${tagName} - FokusMode`;
      } else {
        newTitle = `${timeStr} Break - FokusMode`;
      }

      if (document.title !== newTitle) {
        document.title = newTitle;
      }
    } else {
      if (document.title !== "FokusMode") {
        document.title = "FokusMode";
      }
    }
  }, [timer.isRunning, timer.timeRemaining, sessionMode, selectedTagId, tags, defaultTag]);

  // Force refresh on visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && timer.isRunning) {
        // Title will update via the effect above as timeRemaining changes
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [timer.isRunning]);

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
