import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import type { TimerMode } from "../utils/constants";

interface TimerProps {
  timeLeft: number;
  mode: TimerMode;
  progress: number;
  isRunning: boolean;
  obsidianEnabled: boolean;
  obsidianWorkLabel: string;
  onLabelChange: (label: string) => void;
}

export function Timer({ timeLeft, mode, progress, isRunning, obsidianEnabled, obsidianWorkLabel, onLabelChange }: TimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // SVG circular progress
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const modeLabel = mode === "work" ? "作業中" : "休憩中";
  const modeColor = mode === "work" ? "var(--accent-work)" : "var(--accent-break)";

  // Global cursor tracking via Tauri Rust command (OS-level, works outside window)
  const ringRef = useRef<HTMLDivElement>(null);
  const [dotAngle, setDotAngle] = useState<number>(0);
  const winCacheRef = useRef({ x: 0, y: 0, scale: 1 });

  useEffect(() => {
    const win = getCurrentWindow();

    // Cache window inner position + scale factor
    const initCache = async () => {
      try {
        const [pos, scale] = await Promise.all([win.innerPosition(), win.scaleFactor()]);
        winCacheRef.current = { x: pos.x, y: pos.y, scale };
      } catch {}
    };
    initCache();

    // Update cache when window moves
    let unlisten: (() => void) | undefined;
    win.onMoved((e) => {
      winCacheRef.current.x = e.payload.x;
      winCacheRef.current.y = e.payload.y;
    }).then((fn) => { unlisten = fn; });

    // Poll OS cursor position at ~60 fps via Rust command
    const interval = setInterval(async () => {
      if (!ringRef.current) return;
      try {
        const [cx, cy] = await invoke<[number, number]>("get_cursor_pos");
        const { x: winX, y: winY, scale } = winCacheRef.current;
        // Physical screen coords → logical viewport coords
        const logX = (cx - winX) / scale;
        const logY = (cy - winY) / scale;
        const rect = ringRef.current.getBoundingClientRect();
        const ringCx = rect.left + rect.width / 2;
        const ringCy = rect.top + rect.height / 2;
        setDotAngle(Math.atan2(logY - ringCy, logX - ringCx));
      } catch {}
    }, 16);

    return () => {
      clearInterval(interval);
      unlisten?.();
    };
  }, []);

  // Dot position on the inner edge of the ring (radius - strokeWidth/2)
  const dotRadius = radius - 6;
  const dotX = 65 + dotRadius * Math.cos(dotAngle);
  const dotY = 65 + dotRadius * Math.sin(dotAngle);

  return (
    <div className="timer-container">
      <div className="timer-ring" ref={ringRef}>
        <svg
          width="130"
          height="130"
          viewBox="0 0 130 130"
        >
          {/* Background circle */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="4"
          />
          {/* Progress circle */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke={modeColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 65 65)"
            className={`progress-ring ${isRunning ? "animating" : ""}`}
          />
          {/* Mouse-tracking dot — always on ring, pointing toward cursor */}
          <circle
            cx={dotX}
            cy={dotY}
            r="3"
            fill="rgba(180,180,180,0.5)"
            pointerEvents="none"
          />
        </svg>
        <div className="timer-display">
          <div className="timer-time">{timeStr}</div>
          {isRunning && (
            <div className="timer-mode" style={{ color: modeColor }}>
              {modeLabel}
            </div>
          )}
          {obsidianEnabled && (
            <input
              type="text"
              className="timer-label-input"
              placeholder="work"
              value={obsidianWorkLabel}
              onChange={(e) => onLabelChange(e.target.value)}
              title="Obsidian記録ラベル"
            />
          )}
        </div>
      </div>
    </div>
  );
}
