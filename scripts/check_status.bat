@echo off
REM 服务状态检查脚本

echo ========================================
echo 物流项目服务状态检查
echo ========================================
echo.

echo 1. 检查Redis服务状态:
sc query "Redis-x64" | find "STATE" 
if %errorlevel% equ 0 (
    echo Redis服务状态: 运行中
) else (
    echo Redis服务状态: 未运行
)
echo.

echo 2. 检查Node.js环境:
node --version
echo.

echo 3. 检查npm环境:
npm --version
echo.

echo 4. 检查Backend目录:
if exist "%~dp0backend" (
    echo Backend目录: 存在
) else (
    echo Backend目录: 不存在
)
echo.

echo 5. 检查Web前端目录:
if exist "%~dp0web" (
    echo Web前端目录: 存在
) else (
    echo Web前端目录: 不存在
)
echo.

echo 6. 检查数据库目录:
if exist "%~dp0backend\data" (
    echo 数据库目录: 存在
) else (
    echo 数据库目录: 不存在
)
echo.

echo 7. 检查端口占用情况:
echo 检查常用端口 (3000, 8080, 3001):
netstat -an | find "3000 "
netstat -an | find "8080 "
netstat -an | find "3001 "
echo.

echo 服务状态检查完成！
pause