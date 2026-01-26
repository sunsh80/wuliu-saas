@echo off
echo [%date% %time%] Starting auto push task...
cd /d "C:\Users\Administrator\Desktop\wuliu_project"

git add .

REM Check if there are changes to commit
git diff --cached --quiet
if errorlevel 1 (
    echo Changes detected, committing...
    git config --global user.email "admin@example.com"
    git config --global user.name "Auto Commit"
    git commit -m "Auto commit - %date% %time%"
    
    if %errorlevel% == 0 (
        echo Pulling latest changes...
        git pull origin master --rebase
        echo Pushing to remote repository...
        git push origin master
        echo [%date% %time%] Auto push task completed
    ) else (
        echo Commit failed or no changes to commit
    )
) else (
    echo No changes to push
)

echo Script execution completed
pause