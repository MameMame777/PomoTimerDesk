/** Timer mode */
export type TimerMode = "work" | "break";

/** Application settings */
export interface AppSettings {
  workMinutes: number;
  breakMinutes: number;
  volume: number;
  alwaysOnTop: boolean;
  soundSource: "default" | "custom";
  customSoundFolder: string | null;
  selectedSoundFile: string | null;
  bgOpacity: number;
}

/** Default settings */
export const DEFAULT_SETTINGS: AppSettings = {
  workMinutes: 25,
  breakMinutes: 5,
  volume: 80,
  alwaysOnTop: true,
  soundSource: "default",
  customSoundFolder: null,
  selectedSoundFile: null,
  bgOpacity: 88,
};

/** Supported audio extensions */
export const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a", ".flac"];

/** Local storage key */
export const SETTINGS_STORAGE_KEY = "pomo-timer-settings";

/** Default sound path (served by Vite from public/) */
export const DEFAULT_SOUND_PATH = "/sounds/default-bell.wav";
