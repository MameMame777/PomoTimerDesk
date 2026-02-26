import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { useSettings } from "./useSettings";
import { DEFAULT_SETTINGS, SETTINGS_STORAGE_KEY } from "../utils/constants";

describe("useSettings", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // ── 初期状態 ─────────────────────────────────────
  it("localStorageが空なら DEFAULT_SETTINGS を返す", () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("localStorageに保存済み設定があれば読み込む", () => {
    const stored = { ...DEFAULT_SETTINGS, workMinutes: 50 };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(stored));
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.workMinutes).toBe(50);
  });

  it("localStorageの値が壊れていてもクラッシュしない", () => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, "{ invalid json }");
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  // ── updateSettings ───────────────────────────────
  it("updateSettings で部分的に更新できる", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.updateSettings({ workMinutes: 45 }));
    expect(result.current.settings.workMinutes).toBe(45);
    // 他の設定は変わらない
    expect(result.current.settings.breakMinutes).toBe(DEFAULT_SETTINGS.breakMinutes);
    expect(result.current.settings.volume).toBe(DEFAULT_SETTINGS.volume);
  });

  it("updateSettings が localStorage に永続化される", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.updateSettings({ volume: 50 }));
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!);
    expect(stored.volume).toBe(50);
  });

  it("複数回 updateSettings を重ねても正しく累積される", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.updateSettings({ workMinutes: 30 }));
    act(() => result.current.updateSettings({ breakMinutes: 10 }));
    expect(result.current.settings.workMinutes).toBe(30);
    expect(result.current.settings.breakMinutes).toBe(10);
  });

  // ── resetSettings ────────────────────────────────
  it("resetSettings でデフォルトに戻る", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.updateSettings({ workMinutes: 99, volume: 10 }));
    act(() => result.current.resetSettings());
    expect(result.current.settings).toEqual(DEFAULT_SETTINGS);
  });

  it("resetSettings 後も localStorage が更新される", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.updateSettings({ workMinutes: 99 }));
    act(() => result.current.resetSettings());
    const stored = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)!);
    expect(stored.workMinutes).toBe(DEFAULT_SETTINGS.workMinutes);
  });

  // ── bgOpacity ────────────────────────────────────
  it("bgOpacity の更新が正しく反映される", () => {
    const { result } = renderHook(() => useSettings());
    act(() => result.current.updateSettings({ bgOpacity: 50 }));
    expect(result.current.settings.bgOpacity).toBe(50);
  });
});
