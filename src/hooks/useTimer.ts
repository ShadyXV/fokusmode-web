import { useCallback, useEffect, useRef, useState } from "react";

export interface TimerState {
  timeRemaining: number;
  elapsed: number;
  isRunning: boolean;
  plannedDuration: number;
  progress: number;
}

export function useTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [plannedDuration, setPlannedDuration] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  const timeRemaining = Math.max(0, plannedDuration - elapsed);
  const progress = plannedDuration > 0 ? Math.min(1, elapsed / plannedDuration) : 0;

  const tick = useCallback(() => {
    const now = Date.now();
    const newElapsed = (now - startTimeRef.current) / 1000;
    setElapsed(newElapsed);

    if (newElapsed >= plannedDuration) {
      // Timer completed naturally
      setIsRunning(false);
      setElapsed(plannedDuration);
      return;
    }

    rafRef.current = requestAnimationFrame(tick);
  }, [plannedDuration]);

  useEffect(() => {
    if (isRunning) {
      rafRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isRunning, tick]);

  const start = useCallback((durationSeconds: number) => {
    setPlannedDuration(durationSeconds);
    setElapsed(0);
    startTimeRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const end = useCallback((): { actualDuration: number; completed: boolean } => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
    const actualDuration = Math.round(elapsed);
    const completed = elapsed >= plannedDuration;
    return { actualDuration, completed };
  }, [elapsed, plannedDuration]);

  const reset = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setIsRunning(false);
    setElapsed(0);
    setPlannedDuration(0);
  }, []);

  return {
    timeRemaining,
    elapsed,
    isRunning,
    plannedDuration,
    progress,
    start,
    end,
    reset,
    startTimestamp: startTimeRef.current,
  };
}
