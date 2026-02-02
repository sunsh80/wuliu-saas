# PowerShell script: Automatically install and start Redis
Write-Host "Starting Redis installation and configuration..." -ForegroundColor Green

# Check if running with administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Warning "Please run this script as administrator"
    pause
    exit 1
}

# Define Redis installation path
$redisPath = "$env:PROGRAMFILES\Redis"
$redisZipUrl = "https://github.com/redis-windows/redis/releases/latest/download/redis-latest.zip"
$redisZipPath = "$env:TEMP\redis-latest.zip"

# Create Redis directory
if (!(Test-Path $redisPath)) {
    New-Item -ItemType Directory -Path $redisPath -Force
    Write-Host "Creating Redis directory: $redisPath" -ForegroundColor Cyan
}

# Download Redis
Write-Host "Downloading Redis..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $redisZipUrl -OutFile $redisZipPath -UseBasicParsing
    Write-Host "Redis download completed" -ForegroundColor Green
} catch {
    Write-Error "Failed to download Redis: $_"
    pause
    exit 1
}

# Extract Redis
Write-Host "Extracting Redis..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $redisZipPath -DestinationPath $redisPath -Force
    # Get the extracted folder name
    $extractedFolder = Get-ChildItem -Path $redisPath -Directory | Select-Object -First 1
    if ($extractedFolder) {
        Move-Item -Path "$($extractedFolder.FullName)\*" -Destination $redisPath
        Remove-Item -Path $extractedFolder.FullName
    }
    Write-Host "Redis extraction completed" -ForegroundColor Green
} catch {
    Write-Error "Failed to extract Redis: $_"
    pause
    exit 1
}

# Clean up temporary files
Remove-Item $redisZipPath -Force

# Create Redis configuration file
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

Write-Host "Redis configuration file created: $configPath" -ForegroundColor Green

# Try to stop existing Redis service (if exists)
$serviceName = "Redis-x64"
$serviceExists = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($serviceExists) {
    Write-Host "Stopping existing Redis service..." -ForegroundColor Yellow
    Stop-Service -Name $serviceName -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
}

# Uninstall old Redis service (if exists)
$redisServerPath = Join-Path $redisPath "redis-server.exe"
if (Test-Path $redisServerPath) {
    Start-Process -FilePath $redisServerPath -ArgumentList "--service-uninstall" -NoNewWindow -Wait -ErrorAction SilentlyContinue
}

# Install Redis as Windows service
Write-Host "Installing Redis as Windows service..." -ForegroundColor Yellow
Start-Process -FilePath $redisServerPath -ArgumentList "--service-install", "`"$configPath`"" -NoNewWindow -Wait

# Start Redis service
Write-Host "Starting Redis service..." -ForegroundColor Yellow
Start-Process -FilePath $redisServerPath -ArgumentList "--service-start" -NoNewWindow -Wait

# Wait for service to start
Start-Sleep -Seconds 3

# Check service status
$service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
if ($service -and $service.Status -eq 'Running') {
    Write-Host "Redis service installed and started successfully!" -ForegroundColor Green
    Write-Host "Service name: $serviceName" -ForegroundColor Cyan
    Write-Host "Status: $($service.Status)" -ForegroundColor Cyan
} else {
    Write-Warning "Redis service may not have started properly, please check service status manually"
}

# Test Redis connection
Write-Host "Testing Redis connection..." -ForegroundColor Yellow
try {
    $testResult = & "$redisPath\redis-cli.exe" ping 2>$null
    if ($testResult -eq "PONG") {
        Write-Host "Redis connection test successful: $testResult" -ForegroundColor Green
    } else {
        Write-Warning "Redis connection test failed"
    }
} catch {
    Write-Warning "Cannot test Redis connection: $_"
}

Write-Host "Redis installation and configuration completed!" -ForegroundColor Green
Write-Host "Redis will run automatically on system startup." -ForegroundColor Cyan
pause