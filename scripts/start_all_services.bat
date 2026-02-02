@echo off
REM 一键启动物流项目所有依赖和服务的脚本
REM 包括Redis服务、数据库、以及其他必要的服务

echo ========================================
echo 物流项目一键启动脚本
echo ========================================
echo.

REM 检查是否以管理员权限运行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 请以管理员身份运行此脚本
    pause
    exit /b 1
)

echo 1. 检查并启动Redis服务...
call "%~dp0check_and_start_redis.bat"
echo.

echo 2. 检查Node.js环境...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)
echo.

echo 3. 检查npm环境...
npm --version
if %errorlevel% neq 0 (
    echo 错误: 未找到npm，请先安装Node.js
    pause
    exit /b 1
)
echo.

echo 4. 检查并安装项目依赖...
echo 检查根目录依赖...
cd /d "%~dp0"
npm install

echo 检查backend目录依赖...
if exist "%~dp0backend" (
    cd /d "%~dp0backend"
    npm install
) else (
    echo 警告: backend目录不存在
)
echo.

echo 5. 检查数据库服务...
REM 如果使用SQLite，检查数据库文件是否存在
if exist "%~dp0backend\data" (
    echo SQLite数据目录存在
) else (
    echo 创建SQLite数据目录...
    mkdir "%~dp0backend\data" 2>nul
)

REM 如果使用其他数据库，可以在这里添加检查逻辑
echo.

echo 6. 启动项目服务...
echo 选择启动模式:
echo A. 仅启动Backend服务
echo B. 启动Backend和Frontend服务
echo C. 仅检查依赖（不启动服务）
set /p choice="请输入选择 (A/B/C): "

if /i "%choice%" == "A" (
    echo 启动Backend服务...
    cd /d "%~dp0backend"
    start cmd /k "npm run dev"
) else if /i "%choice%" == "B" (
    echo 启动Backend服务...
    cd /d "%~dp0backend"
    start cmd /k "npm run dev"
    
    echo 启动Frontend服务...
    if exist "%~dp0web" (
        cd /d "%~dp0web"
        start cmd /k "npm run serve"
    ) else (
        echo 警告: web前端目录不存在
    )
) else if /i "%choice%" == "C" (
    echo 仅检查依赖完成，不启动任何服务
) else (
    echo 无效选择，默认启动Backend服务...
    cd /d "%~dp0backend"
    start cmd /k "npm run dev"
)

echo.
echo ========================================
echo 项目依赖和服务启动完成！
echo ========================================
echo.
echo 按任意键退出...
pause >nul