import { useState, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import type { AppSettings } from "../utils/constants";
import { listAudioFiles, previewSound, previewDefaultSound } from "../utils/audio";

interface SettingsProps {
  settings: AppSettings;
  onUpdate: (patch: Partial<AppSettings>) => void;
  onReset: () => void;
}

export function Settings({ settings, onUpdate, onReset }: SettingsProps) {
  const [audioFiles, setAudioFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Load audio files when custom folder changes
  useEffect(() => {
    if (settings.customSoundFolder) {
      setLoading(true);
      listAudioFiles(settings.customSoundFolder)
        .then(setAudioFiles)
        .finally(() => setLoading(false));
    } else {
      setAudioFiles([]);
    }
  }, [settings.customSoundFolder]);

  const handleSelectFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "通知音フォルダを選択",
    });
    if (selected && typeof selected === "string") {
      onUpdate({
        customSoundFolder: selected,
        selectedSoundFile: null,
        soundSource: "custom",
      });
    }
  };

  const handleSoundFileChange = (fileName: string) => {
    onUpdate({ selectedSoundFile: fileName });
  };

  const handlePreview = () => {
    if (
      settings.soundSource === "custom" &&
      settings.customSoundFolder &&
      settings.selectedSoundFile
    ) {
      previewSound(
        `${settings.customSoundFolder}\\${settings.selectedSoundFile}`,
        settings.volume
      );
    } else {
      previewDefaultSound(settings.volume);
    }
  };

  const handleSelectVaultFolder = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Obsidian Vaultフォルダを選択",
    });
    if (selected && typeof selected === "string") {
      onUpdate({ obsidianVaultPath: selected });
    }
  };

  return (
    <div className="settings-panel">
      <h3 className="settings-title">設定</h3>

      {/* Timer durations */}
      <div className="settings-section">
        <label className="settings-label">
          作業時間
          <div className="settings-input-row">
            <input
              type="range"
              min={1}
              max={90}
              value={settings.workMinutes}
              onChange={(e) =>
                onUpdate({ workMinutes: Number(e.target.value) })
              }
            />
            <span className="settings-value">{settings.workMinutes}分</span>
          </div>
        </label>
      </div>

      <div className="settings-section">
        <label className="settings-label">
          休憩時間
          <div className="settings-input-row">
            <input
              type="range"
              min={1}
              max={30}
              value={settings.breakMinutes}
              onChange={(e) =>
                onUpdate({ breakMinutes: Number(e.target.value) })
              }
            />
            <span className="settings-value">{settings.breakMinutes}分</span>
          </div>
        </label>
      </div>

      {/* Sound settings */}
      <div className="settings-section">
        <label className="settings-label">
          音量
          <div className="settings-input-row">
            <input
              type="range"
              min={0}
              max={100}
              value={settings.volume}
              onChange={(e) => onUpdate({ volume: Number(e.target.value) })}
            />
            <span className="settings-value">{settings.volume}%</span>
          </div>
        </label>
      </div>

      <div className="settings-section">
        <label className="settings-label">通知音</label>
        <div className="sound-source-row">
          <button
            className={`sound-source-btn ${settings.soundSource === "default" ? "active" : ""}`}
            onClick={() => onUpdate({ soundSource: "default" })}
          >
            デフォルト
          </button>
          <button
            className={`sound-source-btn ${settings.soundSource === "custom" ? "active" : ""}`}
            onClick={() => onUpdate({ soundSource: "custom" })}
          >
            カスタム
          </button>
        </div>

        {settings.soundSource === "custom" && (
          <div className="custom-sound-section">
            <button className="folder-btn" onClick={handleSelectFolder}>
              📁 フォルダ選択
            </button>
            {settings.customSoundFolder && (
              <div className="folder-path" title={settings.customSoundFolder}>
                {settings.customSoundFolder.split("\\").pop()}
              </div>
            )}
            {loading && <div className="loading-text">読み込み中...</div>}
            {audioFiles.length > 0 && (
              <select
                className="sound-select"
                value={settings.selectedSoundFile || ""}
                onChange={(e) => handleSoundFileChange(e.target.value)}
              >
                <option value="">-- 選択 --</option>
                {audioFiles.map((file) => (
                  <option key={file} value={file}>
                    {file}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <button className="preview-btn" onClick={handlePreview}>
          🔊 試聴
        </button>
      </div>

      {/* Background opacity */}
      <div className="settings-section">
        <label className="settings-label">
          背景の透明度
          <div className="settings-input-row">
            <input
              type="range"
              min={10}
              max={100}
              value={settings.bgOpacity}
              onChange={(e) => onUpdate({ bgOpacity: Number(e.target.value) })}
            />
            <span className="settings-value">{settings.bgOpacity}%</span>
          </div>
        </label>
      </div>

      {/* Obsidian integration */}
      <div className="settings-section">
        <label className="settings-label">
          <span>Obsidian連携</span>
          <div className="settings-input-row">
            <input
              type="checkbox"
              checked={settings.obsidianEnabled}
              onChange={(e) => onUpdate({ obsidianEnabled: e.target.checked })}
            />
            <span className="settings-value">
              {settings.obsidianEnabled ? "有効" : "無効"}
            </span>
          </div>
        </label>

        {settings.obsidianEnabled && (
          <div className="custom-sound-section">
            <button className="folder-btn" onClick={handleSelectVaultFolder}>
              📁 Vaultを選択
            </button>
            {settings.obsidianVaultPath && (
              <div
                className="folder-path"
                title={settings.obsidianVaultPath}
              >
                {settings.obsidianVaultPath.split(/[/\\]/).pop()}
              </div>
            )}
            <label className="settings-label" style={{ marginTop: "6px" }}>
              Daily Notesフォルダ
              <input
                type="text"
                className="text-input"
                placeholder="例: Daily Notes（空欄=Vault直下）"
                value={settings.obsidianDailyNotesFolder ?? ""}
                onChange={(e) =>
                  onUpdate({
                    obsidianDailyNotesFolder: e.target.value || null,
                  })
                }
              />
            </label>
            <label className="settings-label" style={{ marginTop: "6px" }}>
              日付フォーマット
              <select
                className="sound-select"
                value={settings.obsidianDateFormat}
                onChange={(e) =>
                  onUpdate({ obsidianDateFormat: e.target.value })
                }
              >
                <option value="%Y-%m-%d">%Y-%m-%d（例: 2026-03-28）</option>
                <option value="%Y%m%d">%Y%m%d（例: 20260328）</option>
                <option value="%Y年%m月%d日">
                  %Y年%m月%d日（例: 2026年03月28日）
                </option>
              </select>
            </label>
            <label className="settings-label" style={{ marginTop: "6px" }}>
              フォルダ構成
              <select
                className="sound-select"
                value={settings.obsidianFolderStructure}
                onChange={(e) =>
                  onUpdate({
                    obsidianFolderStructure: e.target.value as "flat" | "year-month",
                  })
                }
              >
                <option value="flat">フラット（例: Daily Notes/2026-03-28.md）</option>
                <option value="year-month">年/月（例: Daily Notes/2026/03/2026-03-28.md）</option>
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="settings-footer">
        <button className="reset-btn" onClick={onReset}>
          初期値に戻す
        </button>
      </div>
    </div>
  );
}
