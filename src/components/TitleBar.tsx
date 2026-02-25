import { getCurrentWindow } from "@tauri-apps/api/window";

interface TitleBarProps {
  onSettingsToggle: () => void;
  settingsOpen: boolean;
}

export function TitleBar({ onSettingsToggle, settingsOpen }: TitleBarProps) {
  const appWindow = getCurrentWindow();

  const handleMinimize = () => appWindow.minimize();
  const handleClose = () => appWindow.close();

  return (
    <div className="titlebar" data-tauri-drag-region>
      <span className="titlebar-title" data-tauri-drag-region>
        PomoTimer
      </span>
      <div className="titlebar-buttons">
        <button
          className={`titlebar-btn settings-btn ${settingsOpen ? "active" : ""}`}
          onClick={onSettingsToggle}
          title="設定"
        >
          ⚙
        </button>
        <button
          className="titlebar-btn"
          onClick={handleMinimize}
          title="最小化"
        >
          −
        </button>
        <button
          className="titlebar-btn close-btn"
          onClick={handleClose}
          title="閉じる"
        >
          ×
        </button>
      </div>
    </div>
  );
}
