@echo off
echo 开始长时间间隔推送...
echo 推送时间：%date% %time%
:loop
echo [%time%] 正在尝试推送...
git push origin master
if %errorlevel% == 0 (
    echo [%time%] 推送成功！
    echo 推送完成时间：%date% %time%
    pause
    exit
) else (
    echo [%time%] 推送失败，等待 60 秒后重试...
    timeout /t 60
    goto loop
)