# 设置目标目录（用引号括起来）
$dest = "E:\桌面\打包结果"

# 创建目标目录（如果不存在）
New-Item -ItemType Directory -Path $dest -Force

# 复制整个 bundle 目录
Copy-Item -Recurse -Force .\src-tauri\target\release\bundle\* -Destination $dest

# 单独复制 exe 文件
Copy-Item -Force .\src-tauri\target\release\mc-log-tool.exe -Destination $dest