import { readFile, readDir } from "@tauri-apps/plugin-fs";
import {
  DEFAULT_SOUND_PATH,
  AUDIO_EXTENSIONS,
  type AppSettings,
} from "./constants";

let currentAudio: HTMLAudioElement | null = null;

/**
 * Play notification sound based on current settings.
 */
export async function playNotificationSound(
  settings: AppSettings
): Promise<void> {
  try {
    // Stop any currently playing sound
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    let audioUrl: string;

    if (
      settings.soundSource === "custom" &&
      settings.customSoundFolder &&
      settings.selectedSoundFile
    ) {
      // Load custom sound from filesystem
      const filePath = `${settings.customSoundFolder}\\${settings.selectedSoundFile}`;
      const fileData = await readFile(filePath);
      const ext = settings.selectedSoundFile
        .split(".")
        .pop()
        ?.toLowerCase();
      const mimeType = getMimeType(ext || "wav");
      const blob = new Blob([fileData], { type: mimeType });
      audioUrl = URL.createObjectURL(blob);
    } else {
      // Use default bundled sound
      audioUrl = DEFAULT_SOUND_PATH;
    }

    currentAudio = new Audio(audioUrl);
    currentAudio.volume = settings.volume / 100;
    await currentAudio.play();
  } catch (error) {
    console.error("Failed to play notification sound:", error);
    // Fallback to default sound
    try {
      currentAudio = new Audio(DEFAULT_SOUND_PATH);
      currentAudio.volume = settings.volume / 100;
      await currentAudio.play();
    } catch (fallbackError) {
      console.error("Failed to play fallback sound:", fallbackError);
    }
  }
}

/**
 * Play a preview of a sound file.
 */
export async function previewSound(
  filePath: string,
  volume: number
): Promise<void> {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const fileData = await readFile(filePath);
    const ext = filePath.split(".").pop()?.toLowerCase();
    const mimeType = getMimeType(ext || "wav");
    const blob = new Blob([fileData], { type: mimeType });
    const audioUrl = URL.createObjectURL(blob);

    currentAudio = new Audio(audioUrl);
    currentAudio.volume = volume / 100;
    await currentAudio.play();
  } catch (error) {
    console.error("Failed to preview sound:", error);
  }
}

/**
 * Preview the default sound.
 */
export async function previewDefaultSound(volume: number): Promise<void> {
  try {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }
    currentAudio = new Audio(DEFAULT_SOUND_PATH);
    currentAudio.volume = volume / 100;
    await currentAudio.play();
  } catch (error) {
    console.error("Failed to preview default sound:", error);
  }
}

/**
 * List audio files in a directory.
 */
export async function listAudioFiles(
  dirPath: string
): Promise<string[]> {
  try {
    const entries = await readDir(dirPath);
    return entries
      .filter((entry) => {
        if (!entry.name) return false;
        const ext = entry.name.substring(entry.name.lastIndexOf(".")).toLowerCase();
        return AUDIO_EXTENSIONS.includes(ext);
      })
      .map((entry) => entry.name!)
      .sort();
  } catch (error) {
    console.error("Failed to list audio files:", error);
    return [];
  }
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
