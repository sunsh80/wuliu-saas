@echo off
REM 简化版启动脚本 - 启动后端服务器（无Redis依赖）

echo ========================================
echo 物流项目后端启动脚本（无Redis依赖）
echo ========================================
echo.

echo 检查Node.js和npm环境...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)
npm --version
if %errorlevel% neq 0 (
    echo 错误: 未找到npm，请先安装Node.js
    pause
    exit /b 1
)
echo.

echo 检查并安装项目依赖...
if exist "%~dp0backend" (
    cd /d "%~dp0backend"
    npm install
) else (
    echo 错误: backend目录不存在
    pause
    exit /b 1
)
echo.

echo 检查数据库服务...
if exist "%~dp0backend\data" (
    echo SQLite数据目录存在
) else (
    echo 创建SQLite数据目录...
    mkdir "%~dp0backend\data" 2>nul
)
echo.

echo 启动Backend服务...
cd /d "%~dp0backend"
start cmd /k "title 物流项目 - Backend API Server && echo 启动Backend API服务... && npm run dev"

echo.
echo ========================================
echo 后端服务启动完成！
echo ========================================
echo.
echo 服务启动信息:
echo - Backend API: http://localhost:3000
echo.
echo 按任意键退出...
pause >nul