@echo off
echo [%date% %time%] Starting auto push task...
cd /d "C:\Users\Administrator\Desktop\wuliu_project"

REM Check parameters
if "%1"=="--commit-and-push" goto :commit_and_push
if "%1"=="--push-until-success" goto :push_until_success
if "%1"=="--schedule-daily" goto :schedule_daily
if "%1"=="--run-scheduled-task" goto :run_scheduled_task

echo Usage:
echo   auto_push.bat                           - Auto add, commit and push changes
echo   auto_push.bat --commit-and-push         - Auto add, commit and push changes
echo   auto_push.bat --push-until-success      - Keep trying to push until success
echo   auto_push.bat --schedule-daily          - Schedule daily auto push task at 9AM
echo   auto_push.bat --run-scheduled-task      - Run scheduled push task
goto :end

:commit_and_push
REM Create .gitignore if it doesn't exist
if not exist .gitignore (
    echo node_modules/ > .gitignore
    echo backend/data/mydatabase.db >> .gitignore
    echo backend/data/database.sqlite >> .gitignore
    echo dist/ >> .gitignore
    echo build/ >> .gitignore
    echo .env >> .gitignore
    echo temp_* >> .gitignore
    echo *.tmp >> .gitignore
    echo *.log >> .gitignore
    echo logs/ >> .gitignore
    echo coverage/ >> .gitignore
    echo .vscode/ >> .gitignore
    echo .idea/ >> .gitignore
    echo Created .gitignore file
)

REM Check if there are changes to commit
git add -A

REM Get current branch name
for /f %%i in ('git branch ^| findstr ^*') do set branch=%%i

REM If there are changes, commit and push
git status --porcelain | findstr .
if %errorlevel% neq 0 (
    echo No changes to commit
) else (
    echo Found changes, committing...
    git config --global user.email "admin@example.com"
    git config --global user.name "Auto Commit"
    git commit -m "Update vehicle management features - Implement soft delete for vehicle models, add vehicle status toggle buttons, enhance API documentation, improve UI"

    if %errorlevel% equ 0 (
        echo Pushing to remote repository...
        goto :push_until_success
    ) else (
        echo Commit failed or no changes to commit
    )
)
goto :end

:push_until_success
echo Starting continuous push task...
echo Press Ctrl+C to interrupt push process

:retry_push
echo Attempting to push changes...
git pull origin master --rebase
git push origin master
if %errorlevel% == 0 (
    echo Push successful!
    echo [%date% %time%] Auto push task completed
    goto :end
) else (
    echo Push failed, retrying in 5 seconds...
    timeout /t 5 /nobreak >nul
    goto :retry_push
)
goto :end

:schedule_daily
echo Creating daily auto push task...
schtasks /create /tn "Wuliu Auto Git Push" /tr "cmd /c \"C:\Users\Administrator\Desktop\wuliu_project\auto_push.bat --run-scheduled-task\"" /sc daily /st 09:00 /f

if %errorlevel% equ 0 (
    echo Successfully created scheduled task "Wuliu Auto Git Push"
    echo Task will run daily at 9:00 AM
) else (
    echo Failed to create scheduled task
)

echo.
echo You can manage this task with these commands:
echo - View task: schtasks /query /tn "Wuliu Auto Git Push"
echo - Delete task: schtasks /delete /tn "Wuliu Auto Git Push"
goto :end

:run_scheduled_task
echo [%date% %time%] Running scheduled push task...

REM Create .gitignore if it doesn't exist
if not exist .gitignore (
    echo node_modules/ > .gitignore
    echo backend/data/mydatabase.db >> .gitignore
    echo backend/data/database.sqlite >> .gitignore
    echo dist/ >> .gitignore
    echo build/ >> .gitignore
    echo .env >> .gitignore
    echo temp_* >> .gitignore
    echo *.tmp >> .gitignore
    echo *.log >> .gitignore
    echo logs/ >> .gitignore
    echo coverage/ >> .gitignore
    echo .vscode/ >> .gitignore
    echo .idea/ >> .gitignore
    echo Created .gitignore file
)

REM Check if there are changes to commit
git status --porcelain | findstr .
if %errorlevel% neq 0 (
    echo No changes to commit, pushing directly...
    goto :push_until_success
) else (
    echo Found changes, committing...
    git add -A

    REM Get current branch name
    for /f %%i in ('git branch ^| findstr ^*') do set branch=%%i

    REM Commit changes
    git config --global user.email "admin@example.com"
    git config --global user.name "Auto Commit"
    git commit -m "Scheduled commit - %date% %time%"

    REM Try to push anyway
    goto :push_until_success
)

:end
pause