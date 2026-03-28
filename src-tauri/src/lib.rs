use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use chrono::Local;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

/// Returns the current global cursor position in physical screen pixels.
#[tauri::command]
fn get_cursor_pos(window: tauri::WebviewWindow) -> Result<(f64, f64), String> {
    let pos = window.cursor_position().map_err(|e| e.to_string())?;
    Ok((pos.x, pos.y))
}

/// Appends a work entry with current time to the Obsidian daily note.
/// Creates the file (and any missing parent directories) if needed.
/// `folder_structure`: "flat" | "year-month"
///   - "flat"       → {vault}/{daily_notes_folder}/{date}.md
///   - "year-month" → {vault}/{daily_notes_folder}/YYYY/MM/{date}.md
/// Format written: `{work_label}: HH:MM`
#[tauri::command]
fn append_to_daily_note(
    vault_path: String,
    daily_notes_folder: Option<String>,
    date_format: String,
    folder_structure: String,
    work_label: String,
) -> Result<(), String> {
    let now = Local::now();
    let date_str = now.format(&date_format).to_string();
    let time_str = now.format("%H:%M").to_string();

    let mut path = PathBuf::from(&vault_path);
    if let Some(folder) = daily_notes_folder {
        if !folder.trim().is_empty() {
            path.push(&folder);
        }
    }
    if folder_structure == "year-month" {
        path.push(now.format("%Y").to_string());
        path.push(now.format("%m").to_string());
    }
    std::fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    path.push(format!("{}.md", date_str));

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
        .map_err(|e| e.to_string())?;

    let label = if work_label.trim().is_empty() { "work" } else { work_label.trim() };
    writeln!(file, "- [{}]: {}", label, time_str).map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![get_cursor_pos, append_to_daily_note])
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                window.app_handle().exit(0);
            }
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            // Build tray menu
            let show_item = MenuItem::with_id(app, "show", "表示", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "終了", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_item, &quit_item])?;

            // Build tray icon
            let icon = app.default_window_icon().cloned().expect("no default icon");
            TrayIconBuilder::new()
                .icon(icon)
                .menu(&menu)
                .tooltip("PomoTimer")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click { .. } = event {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
