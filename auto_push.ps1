# 设置工作目录
Set-Location -Path "C:\Users\Administrator\Desktop\wuliu_project"

Write-Host "[$(Get-Date)] 开始自动推送任务..."

# 检查是否有 Git 更改
$changes = git status --porcelain | Out-String

if ($changes.Trim() -ne "") {
    Write-Host "发现更改，正在添加到暂存区..."
    git add .

    # 配置用户信息
    git config --global user.email "admin@example.com"
    git config --global user.name "Auto Commit"

    # 提交更改
    $commitMessage = "自动提交 - $(Get-Date)"
    git commit -m $commitMessage

    if ($LASTEXITCODE -eq 0) {
        Write-Host "正在拉取最新更改..."
        git pull origin master --rebase
        
        Write-Host "正在推送到远程仓库..."
        git push origin master
        
        Write-Host "[$(Get-Date)] 自动推送任务完成"
    } else {
        Write-Host "没有更改需要提交或提交失败"
    }
} else {
    Write-Host "没有检测到更改，无需推送"
}

Write-Host "脚本执行完毕"