import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const timeRemaining = Math.max(0, plannedDuration - elapsed);
  const progress = plannedDuration > 0 ? Math.min(1, elapsed / plannedDuration) : 0;

  const tick = useCallback(() => {
    const now = Date.now();
    const newElapsed = (now - startTimeRef.current) / 1000;
    
    if (newElapsed >= plannedDuration) {
      // Timer completed naturally
      setIsRunning(false);
      setElapsed(plannedDuration);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setElapsed(newElapsed);
  }, [plannedDuration]);

  useEffect(() => {
    if (isRunning) {
      // Use a shorter interval for smooth progress bar (100ms)
      // Browsers will throttle this to ~1s in background, which is fine for title bar
      intervalRef.current = setInterval(tick, 100);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, tick]);

  const start = useCallback((durationSeconds: number, resumeStartTime?: number) => {
    setPlannedDuration(durationSeconds);
    if (resumeStartTime) {
      startTimeRef.current = resumeStartTime;
      const now = Date.now();
      const initialElapsed = (now - resumeStartTime) / 1000;
      setElapsed(initialElapsed);
    } else {
      setElapsed(0);
      startTimeRef.current = Date.now();
    }
    setIsRunning(true);
  }, []);

  const end = useCallback((): { actualDuration: number; completed: boolean } => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    const actualDuration = Math.round(elapsed);
    const completed = elapsed >= plannedDuration - 0.5; // allowance for rounding
    return { actualDuration, completed };
  }, [elapsed, plannedDuration]);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
    setElapsed(0);
    setPlannedDuration(0);
    startTimeRef.current = 0;
  }, []);

  return useMemo(() => ({
    timeRemaining,
    elapsed,
    isRunning,
    plannedDuration,
    progress,
    start,
    end,
    reset,
    startTimestamp: startTimeRef.current,
  }), [timeRemaining, elapsed, isRunning, plannedDuration, progress, start, end, reset]);
}
