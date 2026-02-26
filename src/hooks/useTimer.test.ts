import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useTimer } from "./useTimer";
import type { AppSettings } from "../utils/constants";

// Prevent real audio calls
vi.mock("../utils/audio", () => ({
  playNotificationSound: vi.fn().mockResolvedValue(undefined),
}));

const makeSettings = (workMinutes = 25, breakMinutes = 5): AppSettings => ({
  workMinutes,
  breakMinutes,
  volume: 80,
  alwaysOnTop: true,
  soundSource: "default",
  customSoundFolder: null,
  selectedSoundFile: null,
  bgOpacity: 88,
});

describe("useTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // ── 初期状態 ─────────────────────────────────────
  it("初期値: mode=work, timeLeft=25分, isRunning=false", () => {
    const { result } = renderHook(() => useTimer(makeSettings()));
    expect(result.current.mode).toBe("work");
    expect(result.current.timeLeft).toBe(25 * 60);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  // ── start / pause ────────────────────────────────
  it("start() で isRunning が true になる", () => {
    const { result } = renderHook(() => useTimer(makeSettings()));
    act(() => result.current.start());
    expect(result.current.isRunning).toBe(true);
  });

  it("pause() で isRunning が false になり timeLeft は変わらない", () => {
    const { result } = renderHook(() => useTimer(makeSettings()));
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(10_000); }); // 10秒経過
    const timeBefore = result.current.timeLeft;
    act(() => result.current.pause());
    expect(result.current.isRunning).toBe(false);
    expect(result.current.timeLeft).toBe(timeBefore);
  });

  it("pause 後に start() で再開できる", () => {
    const { result } = renderHook(() => useTimer(makeSettings()));
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(5_000); });
    act(() => result.current.pause());
    const pausedTime = result.current.timeLeft;
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(3_000); });
    expect(result.current.timeLeft).toBe(pausedTime - 3);
  });

  // ── カウントダウン ────────────────────────────────
  it("1秒ごとに timeLeft が減る", () => {
    const { result } = renderHook(() => useTimer(makeSettings()));
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(3_000); });
    expect(result.current.timeLeft).toBe(25 * 60 - 3);
  });

  it("progress = 経過時間/合計時間 × 100", () => {
    const { result } = renderHook(() => useTimer(makeSettings(1, 5))); // 1分
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(30_000); }); // 30秒
    expect(result.current.progress).toBeCloseTo(50, 0);
  });

  // ── reset ────────────────────────────────────────
  it("reset() で timeLeft が全体に戻る", () => {
    const { result } = renderHook(() => useTimer(makeSettings()));
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(60_000); });
    act(() => result.current.reset());
    expect(result.current.timeLeft).toBe(25 * 60);
    expect(result.current.isRunning).toBe(false);
  });

  // ── skip ─────────────────────────────────────────
  it("skip() で work → break に切り替わる", () => {
    const { result } = renderHook(() => useTimer(makeSettings(25, 10)));
    expect(result.current.mode).toBe("work");
    act(() => result.current.skip());
    expect(result.current.mode).toBe("break");
    expect(result.current.timeLeft).toBe(10 * 60);
    expect(result.current.isRunning).toBe(false);
  });

  it("skip() で break → work に切り替わる", () => {
    const { result } = renderHook(() => useTimer(makeSettings(25, 10)));
    act(() => result.current.skip()); // work → break
    act(() => result.current.skip()); // break → work
    expect(result.current.mode).toBe("work");
    expect(result.current.timeLeft).toBe(25 * 60);
  });

  // ── 設定変更 ─────────────────────────────────────
  it("停止中に設定変更すると timeLeft がリセットされる", () => {
    const { result, rerender } = renderHook(
      ({ s }) => useTimer(s),
      { initialProps: { s: makeSettings(25, 5) } }
    );
    // 変更前: 25分
    expect(result.current.timeLeft).toBe(25 * 60);
    rerender({ s: makeSettings(30, 5) });
    expect(result.current.timeLeft).toBe(30 * 60);
  });

  it("実行中に設定変更しても timeLeft はリセットされない (バグ修正の確認)", () => {
    const { result, rerender } = renderHook(
      ({ s }) => useTimer(s),
      { initialProps: { s: makeSettings(25, 5) } }
    );
    act(() => result.current.start());
    act(() => { vi.advanceTimersByTime(60_000); }); // 1分経過
    const timeBefore = result.current.timeLeft;
    // 実行中に workMinutes を変更
    rerender({ s: makeSettings(30, 5) });
    // timeLeft はリセットされず、経過した値のまま
    expect(result.current.timeLeft).toBe(timeBefore);
  });
});
