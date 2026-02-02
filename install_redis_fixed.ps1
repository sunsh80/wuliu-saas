# PowerShell脚本：自动安装并启动Redis
Write-Host "开始安装和配置Redis..." -ForegroundColor Green

# 检查是否以管理员权限运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "请以管理员身份运行此脚本"
    pause
    exit 1
}

# 定义Redis安装路径
$redisPath = "$env:PROGRAMFILES\Redis"
$redisZipUrl = "https://github.com/redis-windows/redis/releases/latest/download/redis-latest.zip"
$redisZipPath = "$env:TEMP\redis-latest.zip"

# 创建Redis目录
if (!(Test-Path $redisPath)) {
    New-Item -ItemType Directory -Path $redisPath -Force
    Write-Host "创建Redis目录: $redisPath" -ForegroundColor Cyan
}

# 下载Redis
Write-Host "正在下载Redis..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $redisZipUrl -OutFile $redisZipPath -UseBasicParsing
    Write-Host "Redis下载完成" -ForegroundColor Green
} catch {
    Write-Error "下载Redis失败: $_"
    pause
    exit 1
}

# 解压Redis
Write-Host "正在解压Redis..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $redisZipPath -DestinationPath $redisPath -Force
    # 获取解压后的文件夹名称
    $extractedFolder = Get-ChildItem -Path $redisPath -Directory | Select-Object -First 1
    if ($extractedFolder) {
        Move-Item -Path "$($extractedFolder.FullName)\*" -Destination $redisPath
        Remove-Item -Path $extractedFolder.FullName
    }
    Write-Host "Redis解压完成" -ForegroundColor Green
} catch {
    Write-Error "解压Redis失败: $_"
    pause
    exit 1
}

# 清理临时文件
Remove-Item $redisZipPath -Force

# 创建Redis配置文件
$configPath = Join-Path $redisPath "redis.conf"
@"
# Redis configuration file
bind 127.0.0.1
port 6379
timeout 0
tcp-keepalive 0
daemonize no
supervised no
loglevel notice
logfile ""
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir ./
maxclients 10000
maxmemory 1gb
maxmemory-policy volatile-lru
appendonly no
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
lua-time-limit 5000
slowlog-log-slower-than 10000
slowlog-max-len 128
notify-keyspace-events ""
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-entries 512
list-max-ziplist-value 64
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit slave 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
aof-rewrite-incremental-fsync yes
"@ | Out-File -FilePath $configPath -Encoding ASCII

Write-Host "Redis配置文件已创建: $configPath" -ForegroundColor Green

# 尝试停止现有的Redis服务（如果存在）
$serviceName = "Redis-x64"
$serviceExists = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($serviceExists) {
    Write-Host "停止现有的Redis服务..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# 卸载旧的Redis服务（如果存在）
$redisServerPath = Join-Path $redisPath "redis-server.exe"
if (Test-Path $redisServerPath) {
    Start-Process -FilePath $redisServerPath -ArgumentList "--service-uninstall" -NoNewWindow -Wait -ErrorAction SilentlyContinue
}

# 安装Redis为Windows服务
Write-Host "安装Redis为Windows服务..." -ForegroundColor Yellow
Start-Process -FilePath $redisServerPath -ArgumentList "--service-install", "`"$configPath`"" -NoNewWindow -Wait

# 启动Redis服务
Write-Host "启动Redis服务..." -ForegroundColor Yellow
Start-Process -FilePath $redisServerPath -ArgumentList "--service-start" -NoNewWindow -Wait

# 等待服务启动
Start-Sleep -Seconds 3

# 检查服务状态
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host "Redis服务已成功安装并启动！" -ForegroundColor Green
    Write-Host "服务名称: $serviceName" -ForegroundColor Cyan
    Write-Host "状态: $($service.Status)" -ForegroundColor Cyan
} else {
    Write-Warning "Redis服务可能未正常启动，请手动检查服务状态"
}

# 测试Redis连接
Write-Host "测试Redis连接..." -ForegroundColor Yellow
try {
    $testResult = & "$redisPath\redis-cli.exe" ping 2>$null
    if ($testResult -eq "PONG") {
        Write-Host "Redis连接测试成功: $testResult" -ForegroundColor Green
    } else {
        Write-Warning "Redis连接测试失败"
    }
} catch {
    Write-Warning "无法测试Redis连接: $_"
}

Write-Host "Redis安装和配置完成！" -ForegroundColor Green
Write-Host "Redis将在系统启动时自动运行。" -ForegroundColor Cyan
pause