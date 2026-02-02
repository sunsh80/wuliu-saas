@echo off
REM 快速启动整个项目（前后端+OpenAPI对齐）

echo 快速启动物流项目...

REM 检查Redis服务
echo 检查Redis服务...
call "%~dp0check_and_start_redis.bat" >nul

REM 启动Backend服务
echo 启动Backend API服务...
cd /d "%~dp0backend"
start cmd /k "title 物流项目 - Backend API Server && echo 启动Backend API服务... && npm run dev"

REM 等待Backend启动
timeout /t 5 /nobreak >nul

REM 启动前端服务
echo 启动前端Web服务...
if exist "%~dp0web\package.json" (
    cd /d "%~dp0web"
    start cmd /k "title 物流项目 - Frontend Web Servers && echo 启动前端Web服务... && npm run dev"
)

echo.
echo 所有服务已启动！
echo Backend API: http://localhost:3000
echo Admin Web: http://localhost:5173
echo Tenant Web: http://localhost:5174
echo Customer Web: http://localhost:5175
echo.
echo 按任意键关闭...
pause >nul