@echo off
REM 快速启动脚本 - 仅启动必需的服务

echo 正在启动物流项目所需服务...

REM 检查Redis服务
echo 跳过Redis服务检查（已移除依赖）...

REM 启动Backend服务
echo 启动Backend服务...
cd /d "%~dp0backend"
start cmd /k "title Backend Service && npm run dev"

REM 等待Backend启动
timeout /t 5 /nobreak >nul

REM 如果有Web前端，也启动它
if exist "%~dp0web\package.json" (
    echo 启动Web前端服务...
    cd /d "%~dp0web"
    start cmd /k "title Web Frontend Service && npm run serve"
)

echo.
echo 所有服务已启动！
echo Backend服务将在新窗口中运行
echo 按任意键关闭...
pause >nul