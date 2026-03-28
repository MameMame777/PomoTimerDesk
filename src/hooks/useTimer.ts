import { useState, useRef, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { TimerMode, AppSettings } from "../utils/constants";
import { playNotificationSound } from "../utils/audio";

interface UseTimerReturn {
  timeLeft: number;
  mode: TimerMode;
  isRunning: boolean;
  progress: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
}

/**
 * Core timer hook managing countdown, mode switching, and notifications.
 */
export function useTimer(settings: AppSettings): UseTimerReturn {
  const totalSeconds = useCallback(
    (m: TimerMode) =>
      m === "work" ? settings.workMinutes * 60 : settings.breakMinutes * 60,
    [settings.workMinutes, settings.breakMinutes]
  );

  const [mode, setMode] = useState<TimerMode>("work");
  // Keep modeRef in sync with mode state
  useEffect(() => { modeRef.current = mode; }, [mode]);
  const [timeLeft, setTimeLeft] = useState(() => totalSeconds("work"));
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef(settings);
  const modeRef = useRef<TimerMode>("work");
  const completedRef = useRef(false);
  const prevSettingsRef = useRef({ workMinutes: settings.workMinutes, breakMinutes: settings.breakMinutes });

  // Keep settingsRef and modeRef in sync
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // When settings change and timer is not running, reset to new duration
  useEffect(() => {
    const settingsChanged =
      prevSettingsRef.current.workMinutes !== settings.workMinutes ||
      prevSettingsRef.current.breakMinutes !== settings.breakMinutes;

    if (settingsChanged && !isRunning) {
      setTimeLeft(totalSeconds(mode));
    }

    prevSettingsRef.current = { workMinutes: settings.workMinutes, breakMinutes: settings.breakMinutes };
  }, [settings.workMinutes, settings.breakMinutes, mode, isRunning, totalSeconds]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const switchMode = useCallback(() => {
    completedRef.current = false;
    const nextMode: TimerMode = mode === "work" ? "break" : "work";
    setMode(nextMode);
    setTimeLeft(totalSeconds(nextMode));
    setIsRunning(false);
    clearTimer();
  }, [mode, totalSeconds, clearTimer]);

  // Countdown effect
  useEffect(() => {
    if (!isRunning) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Timer completed — guard against StrictMode double-invocation
          if (!completedRef.current) {
            completedRef.current = true;
            playNotificationSound(settingsRef.current);
            // Append to Obsidian daily note if enabled
            const s = settingsRef.current;
            if (s.obsidianEnabled && s.obsidianVaultPath && modeRef.current === "work") {
              invoke("append_to_daily_note", {
                vaultPath: s.obsidianVaultPath,
                dailyNotesFolder: s.obsidianDailyNotesFolder ?? null,
                dateFormat: s.obsidianDateFormat,
                folderStructure: s.obsidianFolderStructure,
                workLabel: s.obsidianWorkLabel,
              }).catch((e) => console.error("[Obsidian] append failed:", e));
            }
          }
          // Schedule mode switch
          setTimeout(() => switchMode(), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearTimer;
  }, [isRunning, clearTimer, switchMode]);

  const start = useCallback(() => {
    if (timeLeft > 0) {
      setIsRunning(true);
    }
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    clearTimer();
    setTimeLeft(totalSeconds(mode));
  }, [mode, totalSeconds, clearTimer]);

  const skip = useCallback(() => {
    switchMode();
  }, [switchMode]);

  const total = totalSeconds(mode);
  const progress = total > 0 ? ((total - timeLeft) / total) * 100 : 0;

  return { timeLeft, mode, isRunning, progress, start, pause, reset, skip };
}
