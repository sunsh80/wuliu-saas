@echo off
echo.
echo 物流管理系统 - 开发服务器启动脚本
echo ========================================
echo.

echo 正在启动前端开发服务器...
echo 服务器将在 http://localhost:5173 启动
echo.

cd /d "C:\Users\Administrator\Desktop\wuliu_project\web\admin-web"

echo 启动命令: npm run dev
npm run dev

pause