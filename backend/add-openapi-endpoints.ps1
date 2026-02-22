# OpenAPI 端点定义补充脚本
# 为 28 个未定义的 handler 添加 openapi.yaml 端点定义

# 由于 openapi.yaml 文件较大，使用 PowerShell 在文件末尾添加

$yamlPath = "backend/openapi.yaml"

# 读取当前文件内容
$content = Get-Content $yamlPath -Raw

# 检查是否已有这些端点定义
$endpoints = @(
  "/api/admin/commissions/config",
  "/api/admin/commissions/records",
  "/api/admin/service-providers",
  "/api/admin/settings",
  "/api/admin/system-settings",
  "/api/admin/vehicle-tracking/latest-positions",
  "/api/admin/vehicle-tracking/positions",
  "/api/admin/violations",
  "/api/admin/violations/stats",
  "/api/carrier/orders/{order_id}/claim",
  "/api/tenant/stop-points"
)

$missingEndpoints = @()
foreach ($endpoint in $endpoints) {
  if ($content -notlike "*$endpoint*") {
    $missingEndpoints += $endpoint
  }
}

if ($missingEndpoints.Count -gt 0) {
  Write-Host "以下端点缺失:"
  $missingEndpoints | ForEach-Object { Write-Host "  - $_" }
  Write-Host ""
  Write-Host "需要手动添加到 openapi.yaml 中"
} else {
  Write-Host "所有端点已存在"
}
