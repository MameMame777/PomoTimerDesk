import { useState, useEffect } from "react";
import { getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { TitleBar } from "./components/TitleBar";
import { Timer } from "./components/Timer";
import { Controls } from "./components/Controls";
import { Settings } from "./components/Settings";
import { useSettings } from "./hooks/useSettings";
import { useTimer } from "./hooks/useTimer";
import "./styles/global.css";

const TIMER_SIZE = { width: 160, height: 220 };
const SETTINGS_SIZE = { width: 240, height: 320 };

export default function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { settings, updateSettings, resetSettings } = useSettings();
  const { timeLeft, mode, isRunning, progress, start, pause, reset, skip } =
    useTimer(settings);

  useEffect(() => {
    const win = getCurrentWindow();
    const s = settingsOpen ? SETTINGS_SIZE : TIMER_SIZE;
    win.setSize(new LogicalSize(s.width, s.height)).catch(() => {});
  }, [settingsOpen]);

  return (
    <div
      className={`app-container ${mode}`}
      style={{ "--bg-opacity": settings.bgOpacity / 100 } as React.CSSProperties}
    >
      <TitleBar
        onSettingsToggle={() => setSettingsOpen((v) => !v)}
        settingsOpen={settingsOpen}
      />

      <main className="app-main">
        {settingsOpen ? (
          <Settings
            settings={settings}
            onUpdate={updateSettings}
            onReset={resetSettings}
          />
        ) : (
          <>
            <Timer
              timeLeft={timeLeft}
              mode={mode}
              progress={progress}
              isRunning={isRunning}
              obsidianEnabled={settings.obsidianEnabled}
              obsidianWorkLabel={settings.obsidianWorkLabel}
              onLabelChange={(label) => updateSettings({ obsidianWorkLabel: label })}
            />
            <Controls
              isRunning={isRunning}
              onStart={start}
              onPause={pause}
              onReset={reset}
              onSkip={skip}
            />
          </>
        )}
      </main>
    </div>
  );
}
