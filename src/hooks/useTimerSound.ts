import { useCallback, useRef } from "react";

export function useTimerSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, duration: number, startTime: number, gain: number = 0.3) => {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(frequency, startTime);

      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    },
    [getCtx]
  );

  const playComplete = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Pleasant ascending chime: C5 → E5 → G5 → C6
    playTone(523.25, 0.3, now, 0.25);
    playTone(659.25, 0.3, now + 0.15, 0.25);
    playTone(783.99, 0.3, now + 0.3, 0.25);
    playTone(1046.5, 0.5, now + 0.45, 0.3);
  }, [getCtx, playTone]);

  const playStart = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Soft click
    playTone(880, 0.1, now, 0.15);
  }, [getCtx, playTone]);

  const playInterrupt = useCallback(() => {
    const ctx = getCtx();
    const now = ctx.currentTime;

    // Descending tone
    playTone(523.25, 0.2, now, 0.2);
    playTone(392, 0.3, now + 0.15, 0.2);
  }, [getCtx, playTone]);

  return { playComplete, playStart, playInterrupt };
}
