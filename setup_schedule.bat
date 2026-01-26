@echo off
echo Creating daily auto-push task...

REM Create scheduled task to run daily at 9 AM
schtasks /create /tn "Wuliu Auto Git Push" /tr "powershell.exe -ExecutionPolicy Bypass -File \"C:\Users\Administrator\Desktop\wuliu_project\auto_push.ps1\"" /sc daily /st 09:00 /f

if %errorlevel% equ 0 (
    echo Successfully created scheduled task "Wuliu Auto Git Push"
    echo Task will run daily at 9:00 AM
) else (
    echo Failed to create scheduled task
)

echo.
echo You can manage this task with these commands:
echo - Open Task Scheduler to view and edit the task
echo - Check task details: schtasks /query /tn "Wuliu Auto Git Push"
echo - Delete task: schtasks /delete /tn "Wuliu Auto Git Push"

pause