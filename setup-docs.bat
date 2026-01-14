@echo off
:: 创建 docs 目录（如果不存在）
if not exist "docs" mkdir docs

:: 移动 CSV 文件到 docs/
move /Y "api-validation-checklist.csv" "docs\"

:: 重命名文件为更规范的名称
ren "docs\api-validation-checklist.csv" "api-validation-checklist-v1.csv"

:: 提示完成
echo.
echo ✅ 文件已移动并重命名！
echo 新路径: docs\api-validation-checklist-v1.csv
pause