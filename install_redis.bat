@echo off
echo 正在安装和启动Redis服务...
echo.

REM 检查是否以管理员权限运行
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo 错误: 请以管理员身份运行此脚本
    pause
    exit /b 1
)

echo 设置PowerShell执行策略...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

echo 运行Redis安装脚本...
powershell -File "%~dp0install_and_start_redis.ps1"

echo.
echo 脚本执行完成。
pause