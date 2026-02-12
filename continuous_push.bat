@echo off
echo 开始持续推送...
:loop
git push origin master
if %errorlevel% == 0 (
    echo 推送成功！
    echo 推送完成时间：%date% %time%
    pause
    exit
) else (
    echo 推送失败，%time% 正在重试...
    timeout /t 10
    goto loop
)