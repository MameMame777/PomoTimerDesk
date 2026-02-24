import type { TimerMode } from "../utils/constants";

interface TimerProps {
  timeLeft: number;
  mode: TimerMode;
  progress: number;
  isRunning: boolean;
}

export function Timer({ timeLeft, mode, progress, isRunning }: TimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  // SVG circular progress
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;

  const modeLabel = mode === "work" ? "作業中" : "休憩中";
  const modeColor = mode === "work" ? "var(--accent-work)" : "var(--accent-break)";

  return (
    <div className="timer-container">
      <div className="timer-ring">
        <svg width="130" height="130" viewBox="0 0 130 130">
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
        </svg>
        <div className="timer-display">
          <div className="timer-time">{timeStr}</div>
          <div className="timer-mode" style={{ color: modeColor }}>
            {modeLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
