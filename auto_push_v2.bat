@echo off
setlocal enabledelayedexpansion

echo [%date% %time%] 开始自动推送任务...
cd /d "C:\Users\Administrator\Desktop\wuliu_project"

REM 运行完整的依赖检查
call "%~dp0scripts\full_stack_start.bat"
echo.

REM 检查是否有更改需要提交
git add .

REM 检查是否有暂存的更改
git status --porcelain | findstr "^[^?]"
if %errorlevel% equ 0 (
    echo 发现更改，正在提交...
    git config --global user.email "admin@example.com"
    git config --global user.name "Auto Commit"
    git commit -m "自动提交 - %date% %time%"

    if !errorlevel! equ 0 (
        echo 正在拉取最新更改...
        git pull origin master --rebase || git pull origin master
        echo 正在推送到远程仓库...
        git push origin master
        echo [%date% %time%] 自动推送任务完成
    ) else (
        echo 提交失败或没有更改需要提交
    )
) else (
    echo 没有更改需要推送
)

echo 脚本执行完毕
pause