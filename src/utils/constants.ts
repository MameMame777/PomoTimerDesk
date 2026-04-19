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
  // Obsidian daily note integration
  obsidianEnabled: boolean;
  obsidianVaultPath: string | null;
  obsidianDailyNotesFolder: string | null;
  obsidianDateFormat: string;
  obsidianFolderStructure: "flat" | "year-month";
  obsidianWorkLabel: string;
  // BGM settings
  bgmFolder: string | null;
  bgmVolume: number;
  bgmLoop: "folder" | "single" | "shuffle";
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
  obsidianEnabled: false,
  obsidianVaultPath: null,
  obsidianDailyNotesFolder: null,
  obsidianDateFormat: "%Y-%m-%d",
  obsidianFolderStructure: "flat",
  obsidianWorkLabel: "work",
  bgmFolder: null,
  bgmVolume: 50,
  bgmLoop: "folder",
};

/** Supported audio extensions */
export const AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".m4a", ".flac"];

/** Local storage key */
export const SETTINGS_STORAGE_KEY = "pomo-timer-settings";

/** Default sound path (served by Vite from public/) */
export const DEFAULT_SOUND_PATH = "/sounds/default-bell.wav";
