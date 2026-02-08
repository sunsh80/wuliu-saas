@echo off
echo.
echo 物流管理系统 - 开发环境启动脚本
echo ========================================
echo.

echo 正在启动前端开发服务器...
echo 访问地址: http://localhost:5173
echo.
echo 重要提醒:
echo - 请确保后端服务已运行在 http://192.168.2.250:3000
echo - 请通过浏览器访问URL，不要直接双击HTML文件
echo - 推荐访问路径: http://localhost:5173/login.html
echo.

cd /d "C:\Users\Administrator\Desktop\wuliu_project\web\admin-web"

echo 启动命令: npm run dev
npm run dev

pause