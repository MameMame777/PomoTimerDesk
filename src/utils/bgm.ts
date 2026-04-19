import { readFile } from "@tauri-apps/plugin-fs";
import { listAudioFiles } from "./audio";

/** BGM playback state */
export interface BgmState {
  isPlaying: boolean;
  currentFile: string | null;
  files: string[];
  currentIndex: number;
}

let bgmAudio: HTMLAudioElement | null = null;
let bgmFiles: string[] = [];
let bgmCurrentIndex = 0;
let bgmFolder: string | null = null;
let bgmLoopMode: "folder" | "single" | "shuffle" = "folder";
let bgmVolume = 0.5;
let onStateChange: ((state: BgmState) => void) | null = null;

function getState(): BgmState {
  return {
    isPlaying: bgmAudio !== null && !bgmAudio.paused,
    currentFile: bgmFiles[bgmCurrentIndex] ?? null,
    files: bgmFiles,
    currentIndex: bgmCurrentIndex,
  };
}

function emitState() {
  onStateChange?.(getState());
}

export function setBgmStateListener(listener: (state: BgmState) => void) {
  onStateChange = listener;
}

export function removeBgmStateListener() {
  onStateChange = null;
}

/** Load the file list for a folder. */
export async function loadBgmFolder(folder: string): Promise<string[]> {
  bgmFolder = folder;
  bgmFiles = await listAudioFiles(folder);
  bgmCurrentIndex = 0;
  emitState();
  return bgmFiles;
}

function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    flac: "audio/flac",
  };
  return map[ext] || "audio/wav";
}

async function playFile(index: number): Promise<void> {
  if (!bgmFolder || bgmFiles.length === 0) return;
  if (index < 0 || index >= bgmFiles.length) return;

  bgmCurrentIndex = index;
  const fileName = bgmFiles[bgmCurrentIndex];
  const filePath = `${bgmFolder}\\${fileName}`;

  try {
    const fileData = await readFile(filePath);
    const ext = fileName.split(".").pop()?.toLowerCase() || "wav";
    const mimeType = getMimeType(ext);
    const blob = new Blob([fileData], { type: mimeType });
    const url = URL.createObjectURL(blob);

    if (bgmAudio) {
      bgmAudio.pause();
      if (bgmAudio.src.startsWith("blob:")) {
        URL.revokeObjectURL(bgmAudio.src);
      }
    }

    bgmAudio = new Audio(url);
    bgmAudio.volume = bgmVolume;

    bgmAudio.addEventListener("ended", () => {
      if (bgmLoopMode === "single") {
        playFile(bgmCurrentIndex);
      } else if (bgmLoopMode === "shuffle") {
        playFile(randomOther(bgmCurrentIndex, bgmFiles.length));
      } else {
        playFile((bgmCurrentIndex + 1) % bgmFiles.length);
      }
    });

    bgmAudio.addEventListener("error", () => {
      console.error("BGM playback error:", fileName);
      // Skip to next on error
      if (bgmFiles.length > 1) {
        const next = (bgmCurrentIndex + 1) % bgmFiles.length;
        playFile(next);
      }
    });

    await bgmAudio.play();
    emitState();
  } catch (error) {
    console.error("Failed to play BGM file:", error);
  }
}

/** Start or resume BGM playback. */
export async function bgmPlay(startIndex?: number): Promise<void> {
  if (bgmFiles.length === 0) return;

  if (startIndex !== undefined) {
    await playFile(startIndex);
    return;
  }

  // If paused, resume
  if (bgmAudio && bgmAudio.paused && bgmAudio.src) {
    await bgmAudio.play();
    emitState();
    return;
  }

  // Start from current index
  await playFile(bgmCurrentIndex);
}

/** Pause BGM playback. */
export function bgmPause(): void {
  if (bgmAudio && !bgmAudio.paused) {
    bgmAudio.pause();
    emitState();
  }
}

/** Stop BGM playback and reset. */
export function bgmStop(): void {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio.currentTime = 0;
    if (bgmAudio.src.startsWith("blob:")) {
      URL.revokeObjectURL(bgmAudio.src);
    }
    bgmAudio = null;
  }
  emitState();
}

/** Skip to next track. */
export async function bgmNext(): Promise<void> {
  if (bgmFiles.length === 0) return;
  const next = bgmLoopMode === "shuffle"
    ? randomOther(bgmCurrentIndex, bgmFiles.length)
    : (bgmCurrentIndex + 1) % bgmFiles.length;
  await playFile(next);
}

/** Skip to previous track. */
export async function bgmPrev(): Promise<void> {
  if (bgmFiles.length === 0) return;
  // If more than 3 seconds into the track, restart it
  if (bgmAudio && bgmAudio.currentTime > 3) {
    bgmAudio.currentTime = 0;
    emitState();
    return;
  }
  const prev = (bgmCurrentIndex - 1 + bgmFiles.length) % bgmFiles.length;
  await playFile(prev);
}

/** Set BGM volume (0-100). */
export function setBgmVolume(vol: number): void {
  bgmVolume = Math.max(0, Math.min(1, vol / 100));
  if (bgmAudio) {
    bgmAudio.volume = bgmVolume;
  }
}

/** Set loop mode. */
export function setBgmLoopMode(mode: "folder" | "single" | "shuffle"): void {
  bgmLoopMode = mode;
}

/** Pick a random index different from current. */
function randomOther(current: number, total: number): number {
  if (total <= 1) return 0;
  let next: number;
  do { next = Math.floor(Math.random() * total); } while (next === current);
  return next;
}

/** Get whether BGM is currently playing. */
export function isBgmPlaying(): boolean {
  return bgmAudio !== null && !bgmAudio.paused;
}
