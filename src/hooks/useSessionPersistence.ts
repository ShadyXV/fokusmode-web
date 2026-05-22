import { useCallback } from "react";

const KEYS = {
  ACTIVE: "fokus_session_active",
  START_TIME: "fokus_session_startTime",
  DURATION: "fokus_session_duration",
  MODE: "fokus_session_mode",
  TAG_ID: "fokus_session_tagId",
} as const;

export interface PersistedSession {
  startTime: number;
  duration: number;
  mode: "focus" | "break";
  tagId: string;
}

export function useSessionPersistence() {
  const save = useCallback((duration: number, startTime: number, mode: "focus" | "break", tagId: string) => {
    localStorage.setItem(KEYS.ACTIVE, "true");
    localStorage.setItem(KEYS.START_TIME, String(startTime));
    localStorage.setItem(KEYS.DURATION, String(duration));
    localStorage.setItem(KEYS.MODE, mode);
    localStorage.setItem(KEYS.TAG_ID, tagId);
  }, []);

  const clear = useCallback(() => {
    (Object.values(KEYS) as string[]).forEach((k) => localStorage.removeItem(k));
  }, []);

  const restore = useCallback((): PersistedSession | null => {
    if (localStorage.getItem(KEYS.ACTIVE) !== "true") return null;
    return {
      startTime: Number(localStorage.getItem(KEYS.START_TIME)),
      duration: Number(localStorage.getItem(KEYS.DURATION)),
      mode: (localStorage.getItem(KEYS.MODE) ?? "focus") as "focus" | "break",
      tagId: localStorage.getItem(KEYS.TAG_ID) ?? "",
    };
  }, []);

  return { save, clear, restore };
}
