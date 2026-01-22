@echo off
echo.
echo ==========================================
echo   物流系统API自动化测试运行器
echo ==========================================
echo.

REM 检查Node.js是否已安装
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo 🚀 开始运行API自动化测试...
echo.

REM 运行测试
node final_api_test_runner.js

echo.
echo ==========================================
echo   测试运行完成
echo ==========================================
echo.
echo 报告已保存至: test_report.json
echo 详细日志: logs\api_test_runner.log
echo.

pause