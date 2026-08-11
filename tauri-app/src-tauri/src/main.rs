#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use zip::ZipArchive;
use serde::{Serialize, Deserialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LogEntry {
    pub time: String,
    pub level: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GroupedLog {
    pub level: String,
    pub count: usize,
    pub items: Vec<String>,
}

// ===== 解析单个日志文件 =====
#[tauri::command]
fn parse_logs(path: String) -> Result<String, String> {
    let path = Path::new(&path);
    if !path.exists() {
        return Err("文件不存在".to_string());
    }

    let mut all_logs = Vec::new();

    if let Some(ext) = path.extension() {
        if ext == "zip" {
            let file = fs::File::open(path).map_err(|e| e.to_string())?;
            let mut archive = ZipArchive::new(file).map_err(|e| e.to_string())?;
            let temp_dir = std::env::temp_dir().join("mc_log_tool");
            fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;
            for i in 0..archive.len() {
                let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                let name = file.name().to_string();
                if name.ends_with(".log") || name.ends_with(".txt") {
                    let mut content = String::new();
                    file.read_to_string(&mut content).map_err(|e| e.to_string())?;
                    all_logs.extend(parse_content(&content));
                }
            }
            fs::remove_dir_all(temp_dir).ok();
        } else {
            let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
            all_logs = parse_content(&content);
        }
    } else {
        let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
        all_logs = parse_content(&content);
    }

    let result = serde_json::json!({ "logs": all_logs });
    serde_json::to_string(&result).map_err(|e| e.to_string())
}

// ===== 解析文件夹 =====
#[tauri::command]
fn parse_folder(path: String) -> Result<String, String> {
    let path = Path::new(&path);
    if !path.exists() || !path.is_dir() {
        return Err("路径不存在或不是文件夹".to_string());
    }

    let mut all_logs = Vec::new();
    let mut processed_files = 0;
    let mut error_files = 0;

    fn walk_dir(dir: &Path, logs: &mut Vec<LogEntry>, processed: &mut usize, errors: &mut usize) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    walk_dir(&path, logs, processed, errors);
                } else if let Some(ext) = path.extension() {
                    let ext_str = ext.to_string_lossy().to_lowercase();
                    if ext_str == "log" || ext_str == "txt" || ext_str == "zip" {
                        *processed += 1;
                        if let Ok(content) = fs::read_to_string(&path) {
                            logs.extend(parse_content(&content));
                        } else {
                            *errors += 1;
                        }
                    }
                }
            }
        }
    }

    walk_dir(&path, &mut all_logs, &mut processed_files, &mut error_files);

    let result = serde_json::json!({
        "logs": all_logs,
        "processed_files": processed_files,
        "error_files": error_files,
    });
    serde_json::to_string(&result).map_err(|e| e.to_string())
}

// ===== 解析日志内容 =====
fn parse_content(content: &str) -> Vec<LogEntry> {
    let keywords = ["ERROR", "Exception", "Fatal", "WARN", "INFO", "DEBUG"];
    let mut logs = Vec::new();
    for line in content.lines() {
        for kw in keywords {
            if line.contains(kw) {
                let time = if line.len() > 20 {
                    line[0..20].to_string()
                } else {
                    "".to_string()
                };
                logs.push(LogEntry {
                    time,
                    level: kw.to_string(),
                    content: line.to_string(),
                });
                break;
            }
        }
    }
    logs
}

// ===== 扫描模组文件夹 =====
#[tauri::command]
fn scan_minecraft_mods(path: String) -> Result<Vec<String>, String> {
    let mods_dir = PathBuf::from(path).join("mods");
    if !mods_dir.exists() || !mods_dir.is_dir() {
        return Err("所选目录下未找到 mods 文件夹".to_string());
    }

    let entries = fs::read_dir(mods_dir).map_err(|e| e.to_string())?;
    let mut mod_names = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let entry_path = entry.path();
        if let Some(ext) = entry_path.extension() {
            if ext == "jar" {
                if let Some(name) = entry_path.file_name().and_then(|n| n.to_str()) {
                    mod_names.push(name.to_string());
                }
            }
        }
    }

    mod_names.sort();
    Ok(mod_names)
}

// ===== 主函数 =====
fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            parse_logs,
            parse_folder,
            scan_minecraft_mods,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}