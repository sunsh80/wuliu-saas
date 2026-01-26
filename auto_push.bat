@echo off
echo [%date% %time%] 开始自动推送任务...
cd /d "C:\Users\Administrator\Desktop\wuliu_project"

REM 检查是否有更改需要提交
git add .

REM 获取当前分支名称
for /f %%i in ('git branch ^| findstr ^*') do set branch=%%i

REM 如果有更改，则提交并推送
git status --porcelain | findstr .
if %errorlevel% neq 0 (
    echo 没有更改需要推送
) else (
    echo 发现更改，正在提交...
    git config --global user.email "admin@example.com"
    git config --global user.name "Auto Commit"
    git commit -m "自动提交 - %date% %time%"
    
    if %errorlevel% equ 0 (
        echo 正在推送到远程仓库...
        git pull origin %branch%
        git push origin %branch%
        echo [%date% %time%] 自动推送任务完成
    ) else (
        echo 提交失败或没有更改需要提交
    )
)

pause