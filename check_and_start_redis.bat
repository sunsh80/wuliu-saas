@echo off
REM 项目启动前检查Redis服务的脚本

echo 检查Redis服务状态...
tasklist /FI "IMAGENAME eq redis-server.exe" 2>NUL | find /I /N "redis-server.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo Redis服务正在运行
) else (
    echo Redis服务未运行，正在启动...
    
    REM 尝试启动Redis服务
    sc query Redis-x64 | find "RUNNING" >nul
    if not errorlevel 1 (
        echo 启动Redis Windows服务...
        net start Redis-x64
    ) else (
        echo Redis服务未安装，正在运行安装脚本...
        powershell -ExecutionPolicy Bypass -File "%~dp0install_and_start_redis.ps1"
    )
)

echo.
echo 检查Redis连接...
REM 使用telnet或类似工具简单测试Redis端口
echo quit | telnet 127.0.0.1 6379 >nul 2>&1
if errorlevel 1 (
    echo 警告: 无法连接到Redis服务，请检查服务是否正常运行
) else (
    echo 成功连接到Redis服务
)

echo.
echo 继续启动项目...
REM 这里可以添加启动项目的命令
REM npm start 或 node server.js 等