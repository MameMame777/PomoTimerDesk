import { useState, useRef, useCallback, useEffect } from "react";
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
  const [timeLeft, setTimeLeft] = useState(() => totalSeconds("work"));
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const settingsRef = useRef(settings);

  // Keep settingsRef in sync
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // When settings change and timer is not running, reset to new duration
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(totalSeconds(mode));
    }
  }, [settings.workMinutes, settings.breakMinutes, mode, isRunning, totalSeconds]);

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const switchMode = useCallback(() => {
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
          // Timer completed
          playNotificationSound(settingsRef.current);
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
