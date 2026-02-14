# auto_push.ps1 - 多功能Git推送脚本
param(
    [Parameter(Position=0)]
    [ValidateSet("commit-and-push", "push-until-success", "schedule-daily", "run-scheduled-task", "help")]
    [string]$Action = "commit-and-push"
)

function Show-Help {
    Write-Host "多功能Git推送脚本"
    Write-Host ""
    Write-Host "用法:"
    Write-Host "  powershell -File auto_push.ps1                    - 自动添加、提交并推送更改"
    Write-Host "  powershell -File auto_push.ps1 commit-and-push    - 自动添加、提交并推送更改"
    Write-Host "  powershell -File auto_push.ps1 push-until-success - 持续尝试推送直到成功"
    Write-Host "  powershell -File auto_push.ps1 schedule-daily     - 设置每日9点自动推送任务"
    Write-Host "  powershell -File auto_push.ps1 run-scheduled-task - 执行定时推送任务"
    Write-Host "  powershell -File auto_push.ps1 help               - 显示此帮助信息"
    Write-Host ""
}

function Commit-AndPush {
    Write-Host "[$(Get-Date)] 开始自动推送任务..." -ForegroundColor Green
    
    # 检查并创建 .gitignore 文件
    $gitignorePath = Join-Path $PSScriptRoot ".gitignore"
    if (-not (Test-Path $gitignorePath)) {
        $gitignoreContent = @(
            "node_modules/",
            "backend/data/mydatabase.db",
            "backend/data/database.sqlite",
            "dist/",
            "build/",
            ".env",
            "temp_*",
            "*.tmp",
            "*.log",
            "logs/",
            "coverage/",
            ".vscode/",
            ".idea/",
            ".gitignore"
        )
        $gitignoreContent | Out-File -FilePath $gitignorePath -Encoding UTF8
        Write-Host "已创建 .gitignore 文件" -ForegroundColor Green
    }
    
    # 检查是否有更改需要提交
    $changes = git status --porcelain
    
    if ($changes) {
        Write-Host "发现更改，正在添加到暂存区..." -ForegroundColor Yellow
        git add -A
        
        # 配置用户信息
        git config --global user.email "admin@example.com"
        git config --global user.name "Auto Commit"
        
        # 提交更改
        $commitMessage = @" 
全面更新车型库维护和车辆管理功能

## 车型管理功能增强
- 实现车型软删除功能，使用status和deleted_at字段
- 为tenant_vehicles表添加vehicle_model_id字段，建立车型与车辆关联
- 实现车型使用状态检查，防止删除正在使用的车型
- 更新车型增删改查(CRUD)功能

## 车辆状态管理功能
- 在车辆列表中添加'停用/启用'按钮
- 按钮颜色根据当前状态变化（红色表示停用，绿色表示启用）
- 保留原有的'查看'和'编辑'功能
- 实现车辆状态切换功能

## 数据库结构优化
- 为vehicle_models表添加status和deleted_at字段
- 为tenant_vehicles表添加vehicle_model_id字段
- 确保数据完整性约束

## API文档同步
- 更新OpenAPI规范以反映所有数据库和API变更
- 添加VehicleModel、VehicleModelUpdate、VehicleInfo schema定义
- 确保文档与实际实现保持一致

## 前端界面改进
- 更新车辆管理页面UI
- 添加状态切换交互功能
- 优化用户体验
"@
        
        git commit -m $commitMessage
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "正在推送到远程仓库..." -ForegroundColor Cyan
            Invoke-PushUntilSuccess
        } else {
            Write-Host "提交失败或没有更改需要提交" -ForegroundColor Red
        }
    } else {
        Write-Host "没有检测到更改，无需推送" -ForegroundColor Gray
    }
}

function Invoke-PushUntilSuccess {
    Write-Host "开始持续推送任务..." -ForegroundColor Green
    Write-Host "按 Ctrl+C 可中断推送过程" -ForegroundColor Yellow

    do {
        Write-Host "正在尝试推送更改..." -ForegroundColor Cyan
        git pull origin master --rebase
        git push origin master
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "推送成功！" -ForegroundColor Green
            Write-Host "[$(Get-Date)] 自动推送任务完成" -ForegroundColor Green
            break
        } else {
            Write-Host "推送失败，5秒后重试..." -ForegroundColor Red
            Start-Sleep -Seconds 5
        }
    } while ($true)
}

function Set-DailySchedule {
    Write-Host "创建每日自动推送任务..." -ForegroundColor Green
    
    $scriptPath = Join-Path $PSScriptRoot "auto_push.ps1"
    $action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`" run-scheduled-task"
    $trigger = New-ScheduledTaskTrigger -Daily -At 9am
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
    $principal = New-ScheduledTaskPrincipal -UserId ([System.Security.Principal.WindowsIdentity]::GetCurrent().Name) -RunLevel Highest
    
    try {
        Register-ScheduledTask -TaskName "Wuliu Auto Git Push" -Action $action -Trigger $trigger -Settings $settings -Principal $principal -Description "每日上午9点自动推送Git更改" -Force
        Write-Host "成功创建计划任务 'Wuliu Auto Git Push'" -ForegroundColor Green
        Write-Host "任务将在每天上午9:00运行" -ForegroundColor Green
    } catch {
        Write-Host "创建计划任务失败: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Start-ScheduledTask {
    Write-Host "[$(Get-Date)] 执行定时推送任务..." -ForegroundColor Green
    Set-Location -Path $PSScriptRoot
    
    # 检查并创建 .gitignore 文件
    $gitignorePath = Join-Path $PSScriptRoot ".gitignore"
    if (-not (Test-Path $gitignorePath)) {
        $gitignoreContent = @(
            "node_modules/",
            "backend/data/mydatabase.db",
            "backend/data/database.sqlite",
            "dist/",
            "build/",
            ".env",
            "temp_*",
            "*.tmp",
            "*.log",
            "logs/",
            "coverage/",
            ".vscode/",
            ".idea/",
            ".gitignore"
        )
        $gitignoreContent | Out-File -FilePath $gitignorePath -Encoding UTF8
        Write-Host "已创建 .gitignore 文件" -ForegroundColor Green
    }
    
    # 检查是否有更改需要提交
    $changes = git status --porcelain
    
    if ($changes) {
        Write-Host "发现更改，正在添加到暂存区..." -ForegroundColor Yellow
        git add -A
        
        # 配置用户信息
        git config --global user.email "admin@example.com"
        git config --global user.name "Auto Commit"
        
        # 提交更改
        $commitMessage = "定时提交 - $(Get-Date)"
        git commit -m $commitMessage
    } else {
        Write-Host "没有检测到更改，直接推送..." -ForegroundColor Yellow
    }
    
    # 无论如何都要尝试推送
    Invoke-PushUntilSuccess
}

# 主逻辑
switch ($Action) {
    "commit-and-push" { Commit-AndPush }
    "push-until-success" { Invoke-PushUntilSuccess }
    "schedule-daily" { Set-DailySchedule }
    "run-scheduled-task" { Start-ScheduledTask }
    "help" { Show-Help }
    default { Commit-AndPush }
}