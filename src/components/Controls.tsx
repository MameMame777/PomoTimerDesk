interface ControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export function Controls({
  isRunning,
  onStart,
  onPause,
  onReset,
  onSkip,
}: ControlsProps) {
  return (
    <div className="controls">
      {isRunning ? (
        <button className="control-btn primary" onClick={onPause} title="一時停止">
          ⏸
        </button>
      ) : (
        <button className="control-btn primary" onClick={onStart} title="開始">
          ▶
        </button>
      )}
      <button className="control-btn secondary" onClick={onReset} title="リセット">
        ↻
      </button>
      <button className="control-btn secondary" onClick={onSkip} title="スキップ">
        ⏭
      </button>
    </div>
  );
}
