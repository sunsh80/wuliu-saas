@echo off
:push_loop
echo Trying to push changes...
git push origin master
if %errorlevel% == 0 (
    echo Push successful!
    goto :end
) else (
    echo Push failed, waiting 5 seconds before retry...
    timeout /t 5 /nobreak >nul
    goto :push_loop
)
:end
echo Press any key to exit...
pause >nul