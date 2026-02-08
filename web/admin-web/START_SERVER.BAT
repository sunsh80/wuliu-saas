@echo off
echo.
echo 物流管理系统 - 部署和启动脚本
echo ========================================
echo.

:menu
echo 请选择操作:
echo 1. 启动开发服务器 (前端)
echo 2. 检查API连接
echo 3. 运行API一致性验证
echo 4. 退出
echo.

set /p choice="请输入选择 (1-4): "

if "%choice%"=="1" goto start_dev
if "%choice%"=="2" goto check_api
if "%choice%"=="3" goto verify_api
if "%choice%"=="4" goto exit_script

echo 无效选择，请重试
goto menu

:start_dev
echo.
echo 正在启动前端开发服务器...
echo 访问地址: http://localhost:5173
echo.
cd /d "C:\Users\Administrator\Desktop\wuliu_project\web\admin-web"
npm run dev
pause
goto menu

:check_api
echo.
echo 正在检查API连接...
echo.
echo 请确保后端服务运行在 http://192.168.2.250:3000
echo 检查API端点连通性...
curl -s -o nul -w "%%{http_code}" "http://192.168.2.250:3000/api/health"
if %errorlevel% neq 0 (
  echo.
  echo ❌ 后端服务不可达
) else (
  echo.
  echo ✅ 后端服务可达
)
echo.
pause
goto menu

:verify_api
echo.
echo 运行API一致性验证...
echo.
echo 所有前端页面应使用API基础URL: http://192.168.2.250:3000/api
echo.
echo 您可以访问以下页面进行验证:
echo - http://localhost:5173/api-verification.html
echo - http://localhost:5173/api-endpoint-verification.html
echo.
pause
goto menu

:exit_script
echo.
echo 感谢使用物流管理系统部署脚本
echo.
pause