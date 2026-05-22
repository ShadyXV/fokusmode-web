import { useCallback, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useTimerSound } from "@/hooks/useTimerSound";
import { formatTime } from "@/lib/utils";
import type { useTimer } from "@/hooks/useTimer";

export interface LastRecordedSession {
  mode: "focus" | "break";
  elapsed: number;
  planned: number;
  completed: boolean;
  tagId?: string;
}

export interface RecordResult {
  recorded: LastRecordedSession;
  recommendBreak: boolean;
  recommendedBreakDuration: number;
}

export function useSessionRecording(
  sessionMode: "focus" | "break",
  selectedTagId: string,
  defaultTagId: string | undefined,
  timer: ReturnType<typeof useTimer>,
) {
  const createSession = useMutation(api.sessions.create);
  const createBreak = useMutation(api.breaks.create);
  const { playComplete, playInterrupt } = useTimerSound();
  const [lastRecorded, setLastRecorded] = useState<LastRecordedSession | null>(null);

  // Refs so record() stays stable across timer ticks without stale closures
  const sessionModeRef = useRef(sessionMode);
  sessionModeRef.current = sessionMode;
  const selectedTagIdRef = useRef(selectedTagId);
  selectedTagIdRef.current = selectedTagId;
  const defaultTagIdRef = useRef(defaultTagId);
  defaultTagIdRef.current = defaultTagId;
  const timerRef = useRef(timer);
  timerRef.current = timer;

  const record = useCallback(async (naturalCompletion: boolean): Promise<RecordResult | null> => {
    const t = timerRef.current;
    const mode = sessionModeRef.current;
    const tagId = selectedTagIdRef.current || defaultTagIdRef.current;

    if (mode === "focus" && !tagId) return null;

    const result = naturalCompletion
      ? { actualDuration: t.plannedDuration, completed: true }
      : t.end();

    const status = result.completed ? "completed" : "interrupted";
    const now = Date.now();
    const startedAt = now - result.actualDuration * 1000;

    if (mode === "break") {
      await createBreak({
        plannedDuration: t.plannedDuration,
        actualDuration: result.actualDuration,
        status,
        startedAt,
        endedAt: now,
      });
    } else {
      await createSession({
        tagId: tagId as Id<"tags">,
        plannedDuration: t.plannedDuration,
        actualDuration: result.actualDuration,
        status,
        startedAt,
        endedAt: now,
      });
    }

    if (result.completed) {
      playComplete();
      if (Notification.permission === "granted") {
        const n = new Notification("FokusMode", {
          body: mode === "break"
            ? "Break over! Time to focus."
            : `Session completed! ${formatTime(result.actualDuration)} focused.`,
        });
        n.onclick = () => window.focus();
      }
    } else {
      playInterrupt();
    }

    const recorded: LastRecordedSession = {
      mode,
      elapsed: result.actualDuration,
      planned: t.plannedDuration,
      completed: result.completed,
      tagId: mode === "focus" ? (tagId as string) : undefined,
    };
    setLastRecorded(recorded);

    return {
      recorded,
      recommendBreak: result.completed && mode === "focus" && result.actualDuration > 25 * 60,
      recommendedBreakDuration: result.actualDuration > 60 * 60 ? 15 * 60 : 5 * 60,
    };
  }, [createSession, createBreak, playComplete, playInterrupt]);

  return { record, lastRecorded };
}
