import { useState, useEffect, useCallback, useRef } from "react";
import type { AppSettings } from "../utils/constants";
import {
  type BgmState,
  loadBgmFolder,
  bgmPlay,
  bgmPause,
  bgmStop,
  bgmNext,
  bgmPrev,
  setBgmVolume,
  setBgmLoopMode,
  setBgmStateListener,
  removeBgmStateListener,
} from "../utils/bgm";

export function useBgm(settings: AppSettings, onUpdate: (patch: Partial<AppSettings>) => void) {
  const [state, setState] = useState<BgmState>({
    isPlaying: false,
    currentFile: null,
    files: [],
    currentIndex: 0,
  });

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // Listen for playback state changes
  useEffect(() => {
    setBgmStateListener(setState);
    return () => removeBgmStateListener();
  }, []);

  // Sync volume
  useEffect(() => {
    setBgmVolume(settings.bgmVolume);
  }, [settings.bgmVolume]);

  // Sync loop mode
  useEffect(() => {
    setBgmLoopMode(settings.bgmLoop);
  }, [settings.bgmLoop]);

  // Load folder when it changes
  useEffect(() => {
    if (settings.bgmFolder) {
      loadBgmFolder(settings.bgmFolder);
    }
  }, [settings.bgmFolder]);

  const play = useCallback((index?: number) => {
    bgmPlay(index);
  }, []);

  const pause = useCallback(() => {
    bgmPause();
  }, []);

  const stop = useCallback(() => {
    bgmStop();
  }, []);

  const next = useCallback(() => {
    bgmNext();
  }, []);

  const prev = useCallback(() => {
    bgmPrev();
  }, []);

  const togglePlay = useCallback(() => {
    if (state.isPlaying) {
      bgmPause();
    } else {
      bgmPlay();
    }
  }, [state.isPlaying]);

  const setVolume = useCallback(
    (vol: number) => {
      onUpdate({ bgmVolume: vol });
    },
    [onUpdate]
  );

  const setLoopMode = useCallback(
    (mode: "folder" | "single" | "shuffle") => {
      onUpdate({ bgmLoop: mode });
    },
    [onUpdate]
  );

  return {
    ...state,
    play,
    pause,
    stop,
    next,
    prev,
    togglePlay,
    setVolume,
    setLoopMode,
  };
}
