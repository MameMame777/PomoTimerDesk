import { useState, useCallback, useEffect } from "react";
import {
  type AppSettings,
  DEFAULT_SETTINGS,
  SETTINGS_STORAGE_KEY,
} from "../utils/constants";

/**
 * Hook to manage application settings with localStorage persistence.
 */
export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // ignore parse errors
    }
    return { ...DEFAULT_SETTINGS };
  });

  // Persist to localStorage whenever settings change
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage errors
    }
  }, [settings]);

  const updateSettings = useCallback(
    (patch: Partial<AppSettings>) => {
      setSettingsState((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const resetSettings = useCallback(() => {
    setSettingsState({ ...DEFAULT_SETTINGS });
  }, []);

  return { settings, updateSettings, resetSettings };
}
