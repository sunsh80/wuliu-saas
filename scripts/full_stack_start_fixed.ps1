# PowerShell统一启动脚本 - 启动前后端服务器并确保OpenAPI规范对齐
# 适用于物流项目

Write-Host "========================================" -ForegroundColor Green
Write-Host "物流项目统一启动脚本" -ForegroundColor Green
Write-Host "包括：Redis服务、后端API、前端Web界面、OpenAPI对齐检查" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# 检查是否以管理员权限运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "请以管理员身份运行此脚本"
    Read-Host "按回车键退出"
    exit 1
}

# 函数：检查并启动Redis服务
function CheckAndStartRedis {
    Write-Host "1. 检查并启动Redis服务..." -ForegroundColor Yellow
    
    # 检查Redis服务是否存在
    $redisService = Get-Service -Name "Redis-x64" -ErrorAction SilentlyContinue
    
    if ($redisService) {
        if ($redisService.Status -ne 'Running') {
            Write-Host "Redis服务未运行，正在启动..." -ForegroundColor Yellow
            Start-Service -Name "Redis-x64"
            Start-Sleep -Seconds 3
        }
        
        $redisService = Get-Service -Name "Redis-x64"
        if ($redisService.Status -eq 'Running') {
            Write-Host "Redis服务已启动" -ForegroundColor Green
        } else {
            Write-Warning "Redis服务启动失败"
        }
    } else {
        Write-Host "Redis服务未安装，正在运行安装脚本..." -ForegroundColor Yellow
        & "$PSScriptRoot\..\install_and_start_redis.ps1"
    }
}

# 函数：检查Node.js环境
function CheckNodeEnvironment {
    Write-Host "2. 检查Node.js和npm环境..." -ForegroundColor Yellow
    
    $nodeVersion = try { node --version 2>$null } catch { $null }
    if ($nodeVersion) {
        Write-Host "Node.js版本: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Warning "未找到Node.js，请先安装Node.js"
        Read-Host "按回车键退出"
        exit 1
    }
    
    $npmVersion = try { npm --version 2>$null } catch { $null }
    if ($npmVersion) {
        Write-Host "npm版本: $npmVersion" -ForegroundColor Green
    } else {
        Write-Warning "未找到npm，请先安装Node.js"
        Read-Host "按回车键退出"
        exit 1
    }
}

# 函数：安装项目依赖
function InstallProjectDependencies {
    Write-Host "3. 检查并安装项目依赖..." -ForegroundColor Yellow
    
    # 检查根目录依赖
    Write-Host "检查根目录依赖..." -ForegroundColor Cyan
    Set-Location -Path "$PSScriptRoot\.."
    npm install
    
    # 检查backend目录依赖
    if (Test-Path "$PSScriptRoot\..\backend") {
        Write-Host "检查backend目录依赖..." -ForegroundColor Cyan
        Set-Location -Path "$PSScriptRoot\..\backend"
        npm install
    } else {
        Write-Warning "backend目录不存在"
    }
    
    # 检查web目录依赖
    if (Test-Path "$PSScriptRoot\..\web") {
        Write-Host "检查web目录依赖..." -ForegroundColor Cyan
        Set-Location -Path "$PSScriptRoot\..\web"
        npm install
        
        if (Test-Path "$PSScriptRoot\..\web\admin-web") {
            Write-Host "检查web/admin-web目录依赖..." -ForegroundColor Cyan
            Set-Location -Path "$PSScriptRoot\..\web\admin-web"
            npm install
        }
        
        if (Test-Path "$PSScriptRoot\..\web\tenant-web") {
            Write-Host "检查web/tenant-web目录依赖..." -ForegroundColor Cyan
            Set-Location -Path "$PSScriptRoot\..\web\tenant-web"
            npm install
        }
        
        if (Test-Path "$PSScriptRoot\..\web\customer-web") {
            Write-Host "检查web/customer-web目录依赖..." -ForegroundColor Cyan
            Set-Location -Path "$PSScriptRoot\..\web\customer-web"
            npm install
        }
    } else {
        Write-Warning "web目录不存在"
    }
}

# 函数：验证OpenAPI规范
function ValidateOpenApiSpec {
    Write-Host "4. 验证OpenAPI规范对齐..." -ForegroundColor Yellow
    
    if (Test-Path "$PSScriptRoot\..\backend\validate-openapi.js") {
        Write-Host "检查backend/openapi.yaml与后端实现的对齐..." -ForegroundColor Cyan
        Set-Location -Path "$PSScriptRoot\..\backend"
        $result = node validate-openapi.js
        if ($LASTEXITCODE -eq 0) {
            Write-Host "OpenAPI规范验证通过" -ForegroundColor Green
        } else {
            Write-Warning "OpenAPI规范验证失败，请检查API实现"
        }
    } else {
        Write-Warning "未找到OpenAPI验证脚本"
    }
}

# 函数：检查数据库服务
function CheckDatabase {
    Write-Host "5. 检查数据库服务..." -ForegroundColor Yellow
    
    if (Test-Path "$PSScriptRoot\..\backend\data") {
        Write-Host "SQLite数据目录存在" -ForegroundColor Green
    } else {
        Write-Host "创建SQLite数据目录..." -ForegroundColor Yellow
        New-Item -ItemType Directory -Path "$PSScriptRoot\..\backend\data" -Force
    }
}

# 函数：启动项目服务
function StartProjectServices {
    param(
        [string]$mode
    )
    
    Write-Host "6. 启动服务..." -ForegroundColor Yellow
    
    switch ($mode) {
        "A" {
            Write-Host "启动Backend API服务..." -ForegroundColor Cyan
            Set-Location -Path "$PSScriptRoot\..\backend"
            Start-Process -FilePath "cmd" -ArgumentList "/k", "title Logistics Project - Backend API Server && chcp 65001 && echo Starting Backend API service... && npm run dev"
        }
        "B" {
            Write-Host "启动Backend API服务..." -ForegroundColor Cyan
            Set-Location -Path "$PSScriptRoot\..\backend"
            Start-Process -FilePath "cmd" -ArgumentList "/k", "title Logistics Project - Backend API Server && chcp 65001 && echo Starting Backend API service... && npm run dev"
            
            Write-Host "启动前端Web服务..." -ForegroundColor Cyan
            if (Test-Path "$PSScriptRoot\..\web") {
                Set-Location -Path "$PSScriptRoot\..\web"
                
                # 检查是否安装了concurrently
                $concurrentlyInstalled = npm list -g concurrently --depth=0 2>$null
                if (-not $concurrentlyInstalled) {
                    Write-Host "安装concurrently..." -ForegroundColor Yellow
                    npm install -g concurrently
                }
                
                Start-Process -FilePath "cmd" -ArgumentList "/k", "title Logistics Project - Frontend Web Servers && chcp 65001 && echo Starting frontend web services... && npm run dev"
            } else {
                Write-Warning "web前端目录不存在"
            }
        }
        "C" {
            Write-Host "仅检查依赖完成，不启动任何服务" -ForegroundColor Cyan
        }
        default {
            Write-Host "无效选择，默认启动Backend API服务..." -ForegroundColor Yellow
            Set-Location -Path "$PSScriptRoot\..\backend"
            Start-Process -FilePath "cmd" -ArgumentList "/k", "title Logistics Project - Backend API Server && chcp 65001 && echo Starting Backend API service... && npm run dev"
        }
    }
}

# 执行函数
CheckAndStartRedis
CheckNodeEnvironment
InstallProjectDependencies
ValidateOpenApiSpec
CheckDatabase

# 询问启动模式
Write-Host ""
Write-Host "选择启动模式:" -ForegroundColor White
Write-Host "A. 仅启动Backend API服务" -ForegroundColor White
Write-Host "B. 启动Backend API + 前端Web服务" -ForegroundColor White
Write-Host "C. 仅检查依赖（不启动服务）" -ForegroundColor White
$choice = Read-Host "请输入选择 (A/B/C)"

StartProjectServices -mode $choice

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "项目依赖和服务启动完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "服务启动信息:" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Admin Web: http://localhost:5173" -ForegroundColor Cyan
Write-Host "- Tenant Web: http://localhost:5174" -ForegroundColor Cyan
Write-Host "- Customer Web: http://localhost:5175" -ForegroundColor Cyan
Write-Host ""

Read-Host "按回车键退出"