// src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use zip::ZipArchive;
use serde::{Serialize, Deserialize};
use std::collections::HashSet;

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
            std::fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

            for i in 0..archive.len() {
                let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
                let name = file.name().to_string();
                if name.ends_with(".log") || name.ends_with(".txt") {
                    let mut content = String::new();
                    file.read_to_string(&mut content).map_err(|e| e.to_string())?;
                    all_logs.extend(parse_content(&content));
                }
            }
            std::fs::remove_dir_all(temp_dir).ok();
        } else {
            let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
            all_logs = parse_content(&content);
        }
    } else {
        let content = std::fs::read_to_string(path).map_err(|e| e.to_string())?;
        all_logs = parse_content(&content);
    }

    let result = serde_json::json!({
        "logs": all_logs,
    });
    serde_json::to_string(&result).map_err(|e| e.to_string())
}

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
                        if let Ok(content) = std::fs::read_to_string(&path) {
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


fn scan_mods_dir(dir: &Path) -> Result<Vec<String>, String> {
    if !dir.exists() || !dir.is_dir() {
        return Err("目录不存在".to_string());
    }
    let entries = fs::read_dir(dir).map_err(|e| e.to_string())?;
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

#[tauri::command]
fn scan_minecraft_mods(path: String) -> Result<Vec<String>, String> {
    let base = PathBuf::from(path);

    // 检查一个目录下是否存在 mods 文件夹
    fn find_mods_dir(dir: &Path) -> Option<PathBuf> {
        let mods_dir = dir.join("mods");
        if mods_dir.exists() && mods_dir.is_dir() {
            return Some(mods_dir);
        }
        let mc_mods = dir.join(".minecraft").join("mods");
        if mc_mods.exists() && mc_mods.is_dir() {
            return Some(mc_mods);
        }
        // 如果当前目录下存在 versions 子目录，则尝试进入第一个版本目录
        let versions_dir = dir.join("versions");
        if versions_dir.exists() && versions_dir.is_dir() {
            if let Ok(entries) = std::fs::read_dir(&versions_dir) {
                for entry in entries.flatten() {
                    let version_path = entry.path();
                    if version_path.is_dir() {
                        let version_mods = version_path.join("mods");
                        if version_mods.exists() && version_mods.is_dir() {
                            return Some(version_mods);
                        }
                    }
                }
            }
        }
        None
    }

    // 递归搜索，限制深度避免卡死
    fn search_recursive(dir: &Path, depth: usize, max_depth: usize) -> Option<PathBuf> {
        if depth > max_depth {
            return None;
        }
        // 检查当前目录
        if let Some(mods_path) = find_mods_dir(dir) {
            return Some(mods_path);
        }
        // 遍历子目录，优先处理 versions 目录
        if let Ok(entries) = std::fs::read_dir(dir) {
            let mut sub_dirs: Vec<PathBuf> = entries
                .filter_map(|e| e.ok())
                .filter(|e| e.path().is_dir())
                .map(|e| e.path())
                .collect();
            // 将名为 "versions" 的目录排到前面
            sub_dirs.sort_by_key(|p| {
                if p.file_name().and_then(|n| n.to_str()) == Some("versions") {
                    0
                } else {
                    1
                }
            });
            for sub_path in sub_dirs {
                if let Some(found) = search_recursive(&sub_path, depth + 1, max_depth) {
                    return Some(found);
                }
            }
        }
        None
    }

    // 1. 直接选择了 mods 文件夹本身
    if base.file_name().and_then(|n| n.to_str()) == Some("mods") {
        return scan_mods_dir(&base);
    }

    // 2. 递归搜索，最大深度 6
    if let Some(mods_path) = search_recursive(&base, 0, 6) {
        return scan_mods_dir(&mods_path);
    }

    // 3. 如果发现 .minecraft 目录但没有 mods，给出明确提示
    let mc_dir = base.join(".minecraft");
    if mc_dir.exists() && mc_dir.is_dir() {
        return Err("找到 .minecraft 目录，但其中没有 mods 文件夹（包括 versions 子目录）。请确认模组是否放在 versions 子目录下，或手动选择 mods 文件夹。".to_string());
    }

    Err(format!("所选目录下未找到有效的 .minecraft 或 mods 文件夹（已搜索 6 层子目录），请选择包含 Minecraft 目录的文件夹，或直接选择 mods 文件夹。当前路径：{}", base.display()))
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AnalysisResult {
    pub severity: String,   // "High", "Medium", "Low"
    pub title: String,
    pub suggestion: String,
    pub detail: String,
}

#[tauri::command]
fn analyze_crash(groups: Vec<GroupedLog>, mods: Vec<String>) -> Result<Vec<AnalysisResult>, String> {
    let mut results = Vec::new();

    // 如果模组库为空，给出提示
    if mods.is_empty() {
        results.push(AnalysisResult {
            severity: "Medium".to_string(),
            title: "模组库为空".to_string(),
            suggestion: "请先在“模组管理”页面扫描并导入模组列表，以便更准确地分析缺失依赖。".to_string(),
            detail: "当前模组库中没有模组记录，部分依赖缺失分析可能无法进行。".to_string(),
        });
    }

    // 遍历所有分组（使用引用，不移动）
    for group in &groups {
        // 只分析 ERROR、EXCEPTION、FATAL 级别的日志
        if group.level != "ERROR" && group.level != "EXCEPTION" && group.level != "FATAL" {
            continue;
        }

        // 遍历日志内容（使用引用，不移动）
        for item in &group.items {
            // 规则 1：内存不足
            if item.contains("OutOfMemoryError") 
                || item.contains("Out of memory")
                || item.contains("Unable to allocate") 
                || item.contains("heap") 
            {
                results.push(AnalysisResult {
                    severity: "High".to_string(),
                    title: "内存不足 (Out of Memory)".to_string(),
                    suggestion: "请在启动器或 JVM 参数中增加内存分配，例如设置为 -Xmx4096M（4GB）或更高。".to_string(),
                    detail: item.chars().take(300).collect(),
                });
            }

            // 规则 2：模组缺失或依赖不满足
            if item.contains("Missing Mod") 
                || item.contains("requires")
                || item.contains("dependency")
                || item.contains("mod not found")
                || item.contains("needs mod")
            {
                let mut extracted = "".to_string();
                for word in item.split_whitespace() {
                    if word.contains(".jar") || word.contains("mod") {
                        extracted = word.replace("\"", "").replace(",", "").replace(";", "").to_string();
                        break;
                    }
                }

                let is_installed = if !extracted.is_empty() {
                    mods.iter().any(|m| m.contains(&extracted) || extracted.contains(m))
                } else {
                    false
                };

                let suggestion = if is_installed {
                    format!("日志提示缺失模组 '{}'，但它在您的模组库中已存在，可能是版本不兼容，请检查模组版本。", extracted)
                } else {
                    format!("日志提示缺失模组 '{}'，请检查是否已安装，或查看日志中更详细的缺失信息。", extracted)
                };

                results.push(AnalysisResult {
                    severity: "High".to_string(),
                    title: "模组依赖缺失".to_string(),
                    suggestion,
                    detail: item.chars().take(300).collect(),
                });
            }

            // 规则 3：Java 版本不兼容
            if item.contains("UnsupportedClassVersionError")
                || item.contains("unsupported major.minor version")
                || item.contains("Java version")
            {
                results.push(AnalysisResult {
                    severity: "High".to_string(),
                    title: "Java 版本不兼容".to_string(),
                    suggestion: "请更新或切换 Java 版本（如使用 Java 17 或 21），确保与你的 Minecraft 版本匹配。".to_string(),
                    detail: item.chars().take(300).collect(),
                });
            }

            // 规则 4：模组加载异常
            if item.contains("NoSuchMethodError") 
                || item.contains("ClassNotFoundException")
                || item.contains("NoClassDefFoundError")
                || item.contains("Failed to load class")
            {
                results.push(AnalysisResult {
                    severity: "High".to_string(),
                    title: "模组加载异常（可能冲突或不兼容）".to_string(),
                    suggestion: "请检查模组是否与当前 Minecraft 版本或 Forge/Fabric 版本兼容，尝试更新或移除冲突模组。".to_string(),
                    detail: item.chars().take(300).collect(),
                });
            }

            // 规则 5：渲染/显卡驱动问题
            if item.contains("OpenGL") 
                || item.contains("GLFW")
                || item.contains("render")
                || item.contains("graphics")
                || item.contains("GPU")
            {
                results.push(AnalysisResult {
                    severity: "Medium".to_string(),
                    title: "渲染或显卡驱动问题".to_string(),
                    suggestion: "请更新显卡驱动，或在游戏设置中降低渲染质量（如关闭光影、降低视距）。".to_string(),
                    detail: item.chars().take(300).collect(),
                });
            }

            // 规则 6：Forge/Fabric 加载错误
            if (item.contains("Forge") && (item.contains("Failed") || item.contains("Error"))) 
                || (item.contains("Fabric") && (item.contains("Failed") || item.contains("Error")))
            {
                results.push(AnalysisResult {
                    severity: "High".to_string(),
                    title: "模组加载器（Forge/Fabric）错误".to_string(),
                    suggestion: "请检查模组加载器版本是否与 Minecraft 版本匹配，并确保没有安装冲突的模组。".to_string(),
                    detail: item.chars().take(300).collect(),
                });
            }

            // 规则 7：网络/下载失败
            if item.contains("Connection refused")
                || item.contains("Failed to download")
                || item.contains("Timeout")
                || item.contains("Unable to fetch")
            {
                results.push(AnalysisResult {
                    severity: "Medium".to_string(),
                    title: "网络连接或下载失败".to_string(),
                    suggestion: "请检查网络连接，如果使用了代理或 VPN，请确保其正常工作。".to_string(),
                    detail: item.chars().take(300).collect(),
                });
            }
        }
    }

    // 如果没有分析出具体错误，给出通用建议
    if results.is_empty() {
        let has_errors = groups.iter().any(|g| g.level == "ERROR" || g.level == "EXCEPTION" || g.level == "FATAL");
        if has_errors {
            results.push(AnalysisResult {
                severity: "Low".to_string(),
                title: "存在错误但未识别到具体模式".to_string(),
                suggestion: "请查看完整日志，或尝试逐个移除模组排查。".to_string(),
                detail: "当前分析未匹配到已知错误模式，建议查看日志中 ERROR 级别的内容。".to_string(),
            });
        } else {
            results.push(AnalysisResult {
                severity: "Low".to_string(),
                title: "未发现严重错误".to_string(),
                suggestion: "日志中无 ERROR、EXCEPTION 或 FATAL 级别记录，游戏可能正常启动。".to_string(),
                detail: "如果游戏崩溃，请检查是否有其他位置的日志文件。".to_string(),
            });
        }
    }

    // 去重
    let mut unique_results = Vec::new();
    let mut seen = HashSet::new();
    for r in results {
        let key = format!("{}-{}", r.title, r.suggestion);
        if !seen.contains(&key) {
            seen.insert(key);
            unique_results.push(r);
        }
    }

    Ok(unique_results)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            parse_logs,
            parse_folder,
            scan_minecraft_mods,
			analyze_crash
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}