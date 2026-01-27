# 自动 Git 推送系统说明

## 系统概述
此系统包含一个自动推送脚本和一个 Windows 计划任务，每天上午 9:00 自动将您的更改推送到 Git 远程仓库。

## 文件说明
- `auto_push_simple.bat` - 主要的自动推送脚本
- `setup_schedule.bat` - 创建计划任务的脚本（已运行）

## 功能
- 自动检测文件更改
- 自动添加更改到暂存区
- 自动提交更改（带有时间戳）
- 自动从远程仓库拉取最新更改
- 自动推送到远程仓库

## 管理命令

### 查看任务状态
```
schtasks /query /tn "Wuliu Auto Git Push Daily"
```

### 手动运行脚本
```
C:\Users\Administrator\Desktop\wuliu_project\auto_push_simple.bat
```

### 修改任务运行时间
```
schtasks /change /tn "Wuliu Auto Git Push Daily" /st HH:MM
```
（将HH:MM替换为您想要的时间，例如 14:30 表示下午2:30）

### 删除任务
```
schtasks /delete /tn "Wuliu Auto Git Push Daily" /f
```

### 临时禁用/启用任务
```
# 禁用任务
schtasks /change /tn "Wuliu Auto Git Push Daily" /disable

# 启用任务
schtasks /change /tn "Wuliu Auto Git Push Daily" /enable
```

## 注意事项
1. 确保您的 Git 仓库已正确配置远程仓库地址
2. 确保您有权限推送更改到远程仓库
3. 如果使用需要认证的 Git 仓库，请确保已配置凭据存储
4. 脚本会在每次运行时显示当前日期和时间戳

## 自定义选项
您可以编辑 `auto_push_simple.bat` 文件来自定义以下内容：
- 提交消息格式
- 用户邮箱和姓名
- 运行时间（通过计划任务修改）
- Git 分支名称（默认为 master）

## 故障排除
如果推送失败，请检查：
1. 网络连接
2. Git 仓库权限
3. 远程仓库地址是否正确
4. 是否存在冲突需要手动解决