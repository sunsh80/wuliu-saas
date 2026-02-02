@echo off
REM 统一启动脚本 - 启动前后端服务器并确保OpenAPI规范对齐
REM 适用于物流项目

echo ========================================
echo 物流项目统一启动脚本
echo 包括：Redis服务、后端API、前端Web界面、OpenAPI对齐检查
echo ========================================
echo.

REM 检查是否以管理员权限运行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 请以管理员身份运行此脚本
    pause
    exit /b 1
)

echo 1. 跳过Redis服务检查（已移除依赖）...
echo.

echo 2. 检查Node.js和npm环境...
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

echo 3. 检查并安装项目依赖...
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

echo 检查web目录依赖...
if exist "%~dp0web" (
    cd /d "%~dp0web"
    npm install
    if exist "%~dp0web\admin-web" (
        cd /d "%~dp0web\admin-web"
        npm install
    )
    if exist "%~dp0web\tenant-web" (
        cd /d "%~dp0web\tenant-web"
        npm install
    )
    if exist "%~dp0web\customer-web" (
        cd /d "%~dp0web\customer-web"
        npm install
    )
) else (
    echo 警告: web目录不存在
)
echo.

echo 4. 验证OpenAPI规范对齐...
echo 检查backend/openapi.yaml与后端实现的对齐...
if exist "%~dp0backend\validate-openapi.js" (
    cd /d "%~dp0backend"
    node validate-openapi.js
    if %errorlevel% equ 0 (
        echo OpenAPI规范验证通过
    ) else (
        echo 警告: OpenAPI规范验证失败，请检查API实现
    )
) else (
    echo 未找到OpenAPI验证脚本
)
echo.

echo 5. 检查数据库服务...
if exist "%~dp0backend\data" (
    echo SQLite数据目录存在
) else (
    echo 创建SQLite数据目录...
    mkdir "%~dp0backend\data" 2>nul
)
echo.

echo 6. 启动服务...
echo 选择启动模式:
echo A. 仅启动Backend API服务
echo B. 启动Backend API + 前端Web服务
echo C. 仅检查依赖（不启动服务）
set /p choice="请输入选择 (A/B/C): "

if /i "%choice%" == "A" (
    echo 启动Backend API服务...
    cd /d "%~dp0backend"
    start cmd /k "title 物流项目 - Backend API Server && echo 启动Backend API服务... && npm run dev"
) else if /i "%choice%" == "B" (
    echo 启动Backend API服务...
    cd /d "%~dp0backend"
    start cmd /k "title 物流项目 - Backend API Server && echo 启动Backend API服务... && npm run dev"
    
    echo 启动前端Web服务...
    if exist "%~dp0web" (
        cd /d "%~dp0web"
        REM 检查是否安装了concurrently
        npm list -g concurrently >nul 2>&1
        if %errorlevel% neq 0 (
            echo 安装concurrently...
            npm install -g concurrently
        )
        start cmd /k "title 物流项目 - Frontend Web Servers && echo 启动前端Web服务... && npm run dev"
    ) else (
        echo 警告: web前端目录不存在
    )
) else if /i "%choice%" == "C" (
    echo 仅检查依赖完成，不启动任何服务
) else (
    echo 无效选择，默认启动Backend API服务...
    cd /d "%~dp0backend"
    start cmd /k "title 物流项目 - Backend API Server && echo 启动Backend API服务... && npm run dev"
)

echo.
echo ========================================
echo 项目依赖和服务启动完成！
echo ========================================
echo.
echo 服务启动信息:
echo - Backend API: http://localhost:3000
echo - Admin Web: http://localhost:5173
echo - Tenant Web: http://localhost:5174
echo - Customer Web: http://localhost:5175
echo.
echo 按任意键退出...
pause >nul