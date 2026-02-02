# PowerShell脚本管理器
# 提供对所有启动脚本的统一访问

Write-Host "========================================" -ForegroundColor Green
Write-Host "物流项目脚本管理器" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "可用脚本:" -ForegroundColor Yellow
Write-Host "1. 全栈启动 (前后端+OpenAPI对齐)" -ForegroundColor White
Write-Host "2. 快速全栈启动" -ForegroundColor White
Write-Host "3. 启动所有服务" -ForegroundColor White
Write-Host "4. 快速启动 (仅后端)" -ForegroundColor White
Write-Host "5. 检查服务状态" -ForegroundColor White
Write-Host "6. 查看脚本说明" -ForegroundColor White
Write-Host ""

$choice = Read-Host "请选择要运行的脚本 (1-6)"

$scriptsDir = Join-Path $PSScriptRoot "scripts"

switch ($choice) {
    "1" {
        Write-Host "启动全栈启动脚本..." -ForegroundColor Green
        Start-Process -FilePath "cmd" -ArgumentList "/k", "title 全栈启动 && cd /d `"$scriptsDir`" && call full_stack_start.bat"
    }
    "2" {
        Write-Host "启动快速全栈启动脚本..." -ForegroundColor Green
        Start-Process -FilePath "cmd" -ArgumentList "/k", "title 快速全栈启动 && cd /d `"$scriptsDir`" && call quick_full_stack_start.bat"
    }
    "3" {
        Write-Host "启动所有服务脚本..." -ForegroundColor Green
        Start-Process -FilePath "cmd" -ArgumentList "/k", "title 启动所有服务 && cd /d `"$scriptsDir`" && call start_all_services.bat"
    }
    "4" {
        Write-Host "启动快速启动脚本..." -ForegroundColor Green
        Start-Process -FilePath "cmd" -ArgumentList "/k", "title 快速启动 && cd /d `"$scriptsDir`" && call quick_start.bat"
    }
    "5" {
        Write-Host "启动服务状态检查脚本..." -ForegroundColor Green
        Start-Process -FilePath "cmd" -ArgumentList "/k", "title 检查服务状态 && cd /d `"$scriptsDir`" && call check_status.bat"
    }
    "6" {
        Write-Host "脚本说明:" -ForegroundColor Cyan
        Get-Content "$scriptsDir\START_SCRIPTS_README.md"
        Read-Host "按回车键退出"
    }
    default {
        Write-Host "无效选择" -ForegroundColor Red
        Read-Host "按回车键退出"
    }
}