@echo off
REM 物流项目脚本管理器
REM 提供对所有启动脚本的统一访问

echo ========================================
echo 物流项目脚本管理器
echo ========================================
echo.

echo 可用脚本:
echo 1. 全栈启动 (前后端+OpenAPI对齐)
echo 2. 快速全栈启动
echo 3. 启动所有服务
echo 4. 快速启动 (仅后端)
echo 5. 检查服务状态
echo 6. 查看脚本说明
echo.

set /p choice="请选择要运行的脚本 (1-6): "

cd /d "%~dp0scripts"

if "%choice%"=="1" (
    start cmd /k "title 全栈启动 && call full_stack_start.bat"
) else if "%choice%"=="2" (
    start cmd /k "title 快速全栈启动 && call quick_full_stack_start.bat"
) else if "%choice%"=="3" (
    start cmd /k "title 启动所有服务 && call start_all_services.bat"
) else if "%choice%"=="4" (
    start cmd /k "title 快速启动 && call quick_start.bat"
) else if "%choice%"=="5" (
    start cmd /k "title 检查服务状态 && call check_status.bat"
) else if "%choice%"=="6" (
    type START_SCRIPTS_README.md
    pause
) else (
    echo 无效选择
    pause
)